import { BadRequestException, Injectable, NotFoundException, Response } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceStatus, RevenueKind } from 'src/enums/enum';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { ShipmentSelllingPrice } from 'src/shipment-selling-prices/entities/shipment-selling-price.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { S3Service } from 'src/upload-s3/upload-s3.service';
import { User } from 'src/users/entities/user.entity';
import { Connection, Repository } from 'typeorm';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { SettleInvoiceDto } from './dtos/settle-invoice.dto';
import { UpdatePendingInvoiceDto } from './dtos/update-pending-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { format } from 'date-fns';
import { Bank } from 'src/banks/entities/bank.entity';
import { RevenuesService } from 'src/revenues/revenues.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { CreatePDFService } from 'src/create-pdf/create-pdf.service'

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Quotation) private quotationRepo: Repository<Quotation>,
    @InjectRepository(Bank) private bankRepo: Repository<Bank>,
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentSelllingPrice)
    private shipmentSellingPriceRepo: Repository<ShipmentSelllingPrice>,
    private revenuesService: RevenuesService,
    private whatsappService: WhatsappService,
    private pdfService: CreatePDFService,
    private s3Service: S3Service,
    private connection: Connection,
  ) {}

  async create(user: User, body: CreateInvoiceDto) {
    const { rfqNumber, orderNumber, customerId, sellingPrices } = body

    const isQuotationExist = await this.quotationRepo.findOne({
      where: { rfqNumber, status: 1 },
      select: ['id'],
    });
    if (!isQuotationExist) {
      throw new BadRequestException('Quotation does not exist');
    }

    const shipment = await this.shipmentRepo.findOne({
      where: { orderNumber, rfqNumber, status: 1 },
      select: ['id', 'otifStatus', 'shipmentService'],
    });
    if (!shipment) {
      throw new BadRequestException('Shipment does not exist');
    }

    const isInvoiceExist = await this.invoiceRepo.findOne({
      where: { rfqNumber, orderNumber, status: 1 },
      select: ['id'],
    });
    if (isInvoiceExist) {
      throw new BadRequestException('Invoice has been created');
    }

    let invoiceNumber = 'JKTFF';

    let total = 0

    body.sellingPrices.map(e => {
      total += e.total
    })


    const invoice = await this.invoiceRepo
      .createQueryBuilder('q')
      .select(['q.id', 'q.invoiceNumber'])
      .where(
        'q.createdByCompanyId = :createdByCompanyId',
      )
      .setParameters({
        createdByCompanyId: user.companyId,
      })
      .orderBy('q.id', 'DESC')
      .getOne();

    if (invoice) {
      const nextNumber = +invoice.invoiceNumber.split('FF').pop() + 1;
      invoiceNumber += `${nextNumber}`.padStart(7, '0');
    } else {
      invoiceNumber += '0000001';
    }

    const newInvoice = this.invoiceRepo.create({
      rfqNumber,
      orderNumber,
      customerId,
      invoiceNumber,
      createdByCompanyId: user.companyId,
      createdByUserId: user.userId,
      total
    });

    const previousSellingPrices = await this.shipmentSellingPriceRepo.find({ orderNumber })
    previousSellingPrices.forEach((el) => el.status = 0)

    const sellingPricesValue = [] 
    sellingPrices.forEach(el => {
      sellingPricesValue.push({ 
        ...el, 
        orderNumber, 
        createdByUserId: user.userId, 
      })
    })
    const sellingPricesEntity = this.shipmentSellingPriceRepo.create(sellingPricesValue)

    // adjustment revenue //

    const finalAmount = sellingPricesEntity.reduce((acc, el) => {
      if (el.priceComponent.toLowerCase() !== 'reimbursement'){
        return acc + (+el.price * +el.qty)
      }
      return acc + 0
    }, 0)
    const previousRevenueDetail = await this.revenuesService.getPreviousRevenueDetail(orderNumber)

    let previousFinalAmount = previousRevenueDetail?.finalAmount ?? 0

    const initialAmount = +previousFinalAmount
    const adjustmentAmount = +finalAmount - initialAmount 

    const revenueBody = {
      customerId,
      orderNumber,
      otifStatus: shipment.otifStatus,
      kind: RevenueKind.ADJUSTMENT,
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString(),
      initialAmount,
      finalAmount: +finalAmount,
      adjustmentAmount,
      progressionPercentage: 0,
      progress: 100,
      progressionAmount: 0,
      settled: +finalAmount,
      remaining: 0,
      shipmentService: shipment.shipmentService,
      rfqNumber,
      affiliation: user.affiliation
    }
    const revenue = await this.revenuesService.create(revenueBody)
    
    return await this.connection.transaction(async (entityManager) => {
      await entityManager.save(previousSellingPrices) // soft delete
      await entityManager.save(sellingPricesEntity)
      await entityManager.save(revenue)
      return await entityManager.save(newInvoice);
    })

  }

  async settleInvoice(
    invoiceNumber: string,
    data: SettleInvoiceDto,
    upload: any,
    user: User,
  ) {
    const invoice = await this.invoiceRepo
      .createQueryBuilder('i')
      .innerJoin('i.customer', 'c')
      .innerJoin('i.shipment', 's')
      .innerJoin('i.quotation', 'q')
      .innerJoin('s.shipmentSellingPrice', 'ssp')
      .where(`
        i.invoiceNumber = :invoiceNumber
        AND i.status = :status
        AND c.companyId = :companyId
        AND c.affiliation = :affiliation
        AND s.status = :status
        AND q.status = :status
        AND ssp.status = :status
      `)
      .select(['i'])
      .setParameters({
        invoiceNumber,
        status: 1,
        affiliation: user.affiliation,
        companyId: user.companyId,
      })
      .getOne()

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.invoiceStatus === InvoiceStatus.PENDING) {
      throw new BadRequestException('Invoice has not been issued');
    }
    if (invoice.invoiceStatus === InvoiceStatus.SETTLED) {
      throw new BadRequestException('Invoice has already been settled');
    }

    const { paymentDate, bank, bankHolder, settledAmount } = data;

    if (isNaN(parseInt(settledAmount))) {
      throw new BadRequestException('Settled amount has to be a number');
    }

    await this.s3Service.uploadFiles([upload]);

    const bankEntity = await this.bankRepo.findOne({
      where: {
        name: bank,
        status: 1,
      }
    })

    const fileContainer = 'saas';
    const fileName = upload.hashedFileName;

    Object.assign(invoice, {
      settledDate: format(new Date(), 'yyyy-MM-dd'),
      paymentDate,
      bank,
      bankHolder,
      settledAmount: settledAmount.toString(),
      invoiceStatus: InvoiceStatus.SETTLED,
      updatedByUserId: user.userId,
      fileContainer,
      fileName,
      originalName: upload.file.originalname,
      settledBy: user.userId, 
      url: `${process.env.URL_S3}/${fileContainer}/${fileName}`,
    })

    return await this.connection.transaction(async (entityManager) => {
      if (!bankEntity) {
        const newBankEntity = this.bankRepo.create({
          name: bank,
          createdByUserId: user.userId,
          companyId: user.companyId,
        });
        await entityManager.save(newBankEntity);
      }
      return await entityManager.save(invoice);
    })
  }

  async getDetail(invoiceNumber: string, invoiceStatus: InvoiceStatus, user: User) {
    try {
      const query = this.invoiceRepo
        .createQueryBuilder('i')
        .innerJoin('i.customer', 'c')
        .innerJoinAndSelect('i.shipment', 's')
        .innerJoinAndSelect('i.quotation', 'q')
        .leftJoinAndSelect('s.shipmentSellingPrice', 'ssp', 'ssp.status = :status')
        .where(`
          i.invoiceNumber = :invoiceNumber
          AND i.invoiceStatus = :invoiceStatus
          AND i.status = :status
          AND c.companyId = :companyId
          AND c.affiliation = :affiliation
          AND s.status = :status
          AND q.status = :status
        `)
        .select([
          'i.invoiceNumber',
          'i.invoiceStatus',
          'i.subTotal',
          'i.materai',
          'i.advance',
          'i.total',
          'q.shipmentVia',
          'q.shipmentDate',
          'q.rfqNumber',
          'q.shipmentType',
          'q.shipmentService',
          'q.countryFrom',
          'q.cityFrom',
          'q.addressFrom',
          'q.countryTo',
          'q.cityTo',
          'q.addressTo',
          's.orderNumber',
          's.shipperName',
          's.shipperCompany',
          's.shipperAddress',
          'ssp'
        ])
        .setParameters({
          invoiceNumber,
          invoiceStatus,
          status: 1,
          affiliation: user.affiliation,
          companyId: user.companyId,
        })

      if (invoiceStatus === InvoiceStatus.PENDING) {
        query.addSelect([
          'i.dueDate'
        ])
      } else if (invoiceStatus === InvoiceStatus.SETTLED) {
        query.addSelect([
          'i.paymentDate',
          'i.settledDate',
          'i.bank',
          'i.bankHolder',
          'i.settledAmount',
          'i.originalName',
          'i.url'
        ])
      }

      const invoice = await query.getOne()

      if (!invoice) {
        throw new NotFoundException('Invoice not found')
      }
      
      if (!invoice.subTotal) {
        invoice.subTotal = invoice?.shipment?.shipmentSellingPrice
          .reduce((acc, el) =>  acc + +el.total, 0)
      }

      if (!invoice.total){
        invoice.total = invoice.subTotal;
      }

      return invoice

    } catch (error) {
      throw error
    }
  }

  async getPreview(invoiceNumber: string, user: User){
    try {
      const query = await this.invoiceRepo
        .createQueryBuilder('i')
        .leftJoin('i.shipment', 's')
        .leftJoinAndSelect('s.shipmentSellingPrice', 'ssp')
        .leftJoinAndSelect('i.customer', 'cust')
        .leftJoinAndSelect('cust.company', 'comp')
        .leftJoinAndSelect('comp.paymentAdvices', 'pa', 'pa.status = :status')
        .where(
          `
          i.invoiceNumber = :invoiceNumber
          AND ssp.status = :status
          AND cust.affiliation = :affiliation
          AND cust.companyId = :companyId
        `,
        )
        .select([
          'i.invoiceNumber',
          'i.subTotal',
          'i.materai',
          'i.advance',
          'i.total',
          'i.dueDate',
          's.rfqNumber',
          'ssp',
          'cust.fullName',
          'cust.address',
          'cust.npwp',
          'comp.name',
          'comp.logo',
          'comp.address',
          'pa.currencyName',
          'pa.bankName',
          'pa.accNumber',
          'pa.accHolder',
          'pa.paymentInstructions'
        ])
        .setParameters({
          invoiceNumber,
          status: 1,
          affiliation: user.affiliation,
          companyId: user.companyId,
        })

      const invoice : any = await query.getOne();


      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (!invoice.subTotal) {
        invoice.subTotal = invoice?.shipment?.shipmentSellingPrice.reduce(
          (acc, el) => acc + +el.total,
          0,
        );
      }

      invoice.invoiceDate = format(new Date(), 'yyyy-MM-dd');
      invoice.company = invoice.customer.company;
      delete invoice.customer.company;
      
      return invoice;
    } catch (error) {
      throw error;
    }
  }

  async getList(
    invoiceStatus: InvoiceStatus,
    page: number,
    perpage: number,
    filter: string,
    date: string,
    user: User,
  ){
    try {
      const limit = perpage;
      const offset = perpage * (page - 1);
  
      let query = this.invoiceRepo
        .createQueryBuilder('i')
        .innerJoinAndSelect('i.customer', 'c')
        .innerJoin('i.shipment', 's')
        .innerJoin('i.quotation', 'q')
        .where(`
          i.invoiceStatus = :invoiceStatus
          AND c.affiliation = :affiliation
          AND c.companyId = :companyId
          AND i.status = :status
          AND s.status = :status
          AND q.status = :status
        `)
        .setParameters({
          invoiceStatus,
          status: 1,
          affiliation: user.affiliation,
          companyId: user.companyId,
        })
        .select([
          'i.invoiceStatus',
          'i.createdAt',
          'i.rfqNumber',
          'i.invoiceNumber',
          'c.companyName',
          // issued invoice
          'i.dueDate',
          'i.issuedDate',
          'i.total',
          // settled invoice
          'i.settledDate',
          'i.settledAmount',
        ])

      if (filter) {
        query = query.andWhere(
          `((i.rfqNumber like :filter) OR (i.invoiceNumber like :filter) OR (c.companyName like :filter))`,
          { filter: `%${filter}%` },
        );
      }
      
      if (date) {
        const from = date.split('to')[0];
        const until = date.split('to')[1];
        if (invoiceStatus === InvoiceStatus.PENDING) {
          query.andWhere(
            `(DATE(i.createdAt) >= :from AND DATE(i.createdAt) <= :until)`,
            { from, until },
          );
        } else if (invoiceStatus === InvoiceStatus.ISSUED) {
          query.andWhere(
            `(DATE(i.issuedDate) >= :from AND DATE(i.issuedDate) <= :until)`,
            { from, until },
          );
        } else if (invoiceStatus === InvoiceStatus.SETTLED) {
          query.andWhere(
            `(DATE(i.settledDate) >= :from AND DATE(i.settledDate) <= :until)`,
            { from, until },
          );
        }
      }

      if (invoiceStatus === InvoiceStatus.PENDING) {
        query.addSelect([
          'i.createdAt',
        ])
      } else if (invoiceStatus === InvoiceStatus.ISSUED) {
        query.addSelect([
          'i.dueDate',
          'i.issuedDate',
          'i.total',
        ])
      } else if (invoiceStatus === InvoiceStatus.SETTLED) {
        query.addSelect([
          'i.settledDate',
          'i.settledAmount'
        ])
      }

      query.orderBy('i.createdAt', 'DESC');

      const allData = await query.getMany();
      const totalRecord = allData.length;
   
      const data = await query.limit(limit).offset(offset).getMany();
      
      const totalShowed = data.length;

      return {
        page,
        totalRecord,
        totalShowed,
        totalPage: Math.ceil(totalRecord / limit),
        showing: `${totalRecord === 0 ? 0 : offset + 1} - ${
          offset + totalShowed
        } of ${totalRecord}`,
        next: offset + totalShowed !== totalRecord,
        data,
      }

    } catch (error) {
      throw error
    }
  }

  async updateOrIssueInvoice(
    invoiceNumber: string, 
    body: UpdatePendingInvoiceDto, 
    user: User,
    isIssue?: boolean,
  ){
    try {
      const { sellingPrices } = body

      const invoice = await this.invoiceRepo
        .createQueryBuilder('i')
        .innerJoinAndSelect('i.customer', 'c')
        .innerJoinAndSelect('i.shipment', 's')
        .innerJoinAndSelect('i.quotation', 'q')
        .leftJoin('s.shipmentSellingPrice', 'ssp', 'ssp.status = :status')
        .where(`
          i.invoiceNumber = :invoiceNumber
          AND i.status = :status
          AND c.affiliation = :affiliation
          AND c.companyId = :companyId
          AND s.status = :status
          AND q.status = :status
        `)
        .setParameters({
          invoiceNumber,
          status: 1,
          affiliation: user.affiliation,
          companyId: user.companyId,
        })
        .getOne()

      if (!invoice) {
        throw new BadRequestException('Invoice not found')
      }
      if (invoice.invoiceStatus !== InvoiceStatus.PENDING) {
        throw new BadRequestException('Only allows update as invoice is pending')
      }

      const sellingPricesValue = [] 
      sellingPrices.forEach(el => {
        sellingPricesValue.push({ 
          ...el, 
          orderNumber: invoice.orderNumber, 
          createdByUserId: user.userId,
        })
      })

      const result = await this.connection.transaction(async (entityManager) => {
        await entityManager
          .createQueryBuilder()
          .update(ShipmentSelllingPrice)
          .set({ status: 0, updatedByUserId: user.userId })
          .where(`
            orderNumber = :orderNumber
            AND status = :status
          `)
          .setParameters({
            orderNumber: invoice.orderNumber,
            status: 1
          })
          .execute()
          
        const newSellingPrices = this.shipmentSellingPriceRepo.create(sellingPricesValue)
        await entityManager.save(newSellingPrices)

        Object.assign(invoice, {
          dueDate: body.dueDate,
          subTotal: body.subTotal,
          materai: body.materai,
          advance: body.advance,
          total: body.total
        })

        if (isIssue) {
          invoice.invoiceStatus = InvoiceStatus.ISSUED
          invoice.issuedDate = format(new Date(), 'yyyy-MM-dd')
          invoice.issuedBy = user.userId
          if (!newSellingPrices) {
            throw new BadRequestException('Please input price first')
          }
        }

        // adjustment revenue //

        const finalAmount = newSellingPrices.reduce((acc, el) => {
          if (el.priceComponent.toLowerCase() !== 'reimbursement'){
            return acc + (+el.price * +el.qty)
          }
          return acc + 0
        }, 0)
        const previousRevenueDetail = await this.revenuesService.getPreviousRevenueDetail(invoice.orderNumber)
    
        let previousFinalAmount = previousRevenueDetail?.finalAmount ?? 0
    
        const initialAmount = +previousFinalAmount
        const adjustmentAmount = +finalAmount - initialAmount 
    
        const revenueBody = {
          customerId: invoice.customerId,
          orderNumber: invoice.orderNumber,
          otifStatus: invoice.shipment.otifStatus,
          kind: RevenueKind.ADJUSTMENT,
          year: new Date().getFullYear().toString(),
          month: (new Date().getMonth() + 1).toString(),
          initialAmount,
          finalAmount: +finalAmount,
          adjustmentAmount,
          progressionPercentage: 0,
          progress: 100,
          progressionAmount: 0,
          settled: +finalAmount,
          remaining: 0,
          shipmentService: invoice.shipment.shipmentService,
          rfqNumber: invoice.rfqNumber,
          affiliation: user.affiliation
        }
        const revenue = await this.revenuesService.create(revenueBody)

        await entityManager.save(revenue)
        return await entityManager.save(invoice)

      })
      
      if(result && isIssue){
        let company = await this.getPreview(invoiceNumber, user)
        let buffer = await this.pdfService.invoicePDF(company)
        const data = {
          invoiceNumber,
          buffer
        }
        let url = await this.s3Service.uploadPDF(data)
        const phone = `${invoice.customer.phoneCode}${invoice.customer.phoneNumber}`
        const message = `Dear Customer,\n\nYour Invoice for the shipment details as below is ready.\n\nRFQ Number: ${invoice.rfqNumber} \nOrigin City: ${invoice.quotation.cityFrom} \nDestination City: ${invoice.quotation.cityTo} \nShipment Service: ${invoice.quotation.shipmentService} \n\nYou can download your invoice by clicking this link below \n\n${url}\n\nBest Regards, \nCardig `
        await this.whatsappService.sendMessage(phone, message)
        delete invoice.customer
        delete invoice.quotation
        delete invoice.shipment
      }

      delete result.customer
      delete result.quotation
      delete result.shipment

      return result
    } catch (error) {
      throw error
    }
  }
  
  async downloadProof(res: any, invoiceNumber: string, user: User){
    try{
      const invoice = await this.invoiceRepo
        .createQueryBuilder('i')
        .innerJoinAndSelect('i.customer', 'c')
        .innerJoin('i.shipment', 's')
        .innerJoin('i.quotation', 'q')
        .innerJoin('s.shipmentSellingPrice', 'ssp')
        .where(`
          i.invoiceNumber = :invoiceNumber 
          AND i.status
          AND c.affiliation = :affiliation 
          AND c.companyId = :companyId 
          AND s.status = :status
          AND q.status = :status
          AND ssp.status = :status
        `)
        .setParameters({ 
          affiliation: user.affiliation, 
          companyId: user.companyId ,
          invoiceNumber,
          status: 1
        })
        .select(['i.fileName', 'i.originalName'])
        .getOne();
      
        if (!invoice){
          throw new NotFoundException();
        }

        await this.s3Service.downloadFile(invoice.fileName, res)
      
    } catch (error) {
      throw error;
    }
  }
}
