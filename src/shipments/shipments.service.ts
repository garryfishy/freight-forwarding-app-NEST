import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm';

import { format } from 'date-fns'
import { Helper } from '../helpers/helper'

import { InvoiceStatus, OtifStatus, RevenueKind, RfqStatus, ShipmentStatus, ShipmentVia } from 'src/enums/enum';
import { Brackets, Connection, Repository } from 'typeorm';
import { CreateShipmentDto } from './dtos/create-shipment.dto';
import { Shipment } from './entities/shipment.entity';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { UpdateShipmentDto } from './dtos/update-shipment.dto';
import { User } from 'src/users/entities/user.entity';
import { BidPrice } from 'src/bids/entities/bid-price.entity';
import { ShipmentSelllingPrice } from 'src/shipment-selling-prices/entities/shipment-selling-price.entity';
import { Revenue } from 'src/revenues/entities/revenue.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    @InjectRepository(Quotation) private quotationRepo: Repository<Quotation>,
    @InjectRepository(BidPrice) private bidPriceRepo: Repository<BidPrice>,
    @InjectRepository(ShipmentSelllingPrice) private shipmentSellingPriceRepo: Repository<ShipmentSelllingPrice>,
    @InjectRepository(Revenue) private revenueRepo: Repository<Revenue>,
    private connection: Connection,
    private helper: Helper,
  ) {}

  async create(
    user: User,
    rfqNumber: string,
    body: CreateShipmentDto,
  ) {
    try {
      const quotation = await this.quotationRepo.findOne({ 
        rfqNumber, 
        createdByCompanyId: user.companyId, 
        status: 1 
      })
      if (!quotation) {
        throw new NotFoundException('Quotation not found')
      }
      if (quotation.rfqStatus === RfqStatus.WAITING) {
        throw new BadRequestException('Quotation must submit bid first')
      }
      if (quotation.rfqStatus === RfqStatus.COMPLETED) {
        throw new BadRequestException('Shipment already exist')
      }

      const clientId = `${user.companyId}`.padStart(4, '0');
      const currentDate = format(new Date(), 'yyyyMMdd');
      const lastNumberRfq = rfqNumber.split('-').pop();
      const code = this.helper.generateShipmentTypeCode(quotation.shipmentType)

      const orderNumber = `ORD/${clientId}/${currentDate}-${lastNumberRfq}-${code}`

      const shipment = this.shipmentRepo.create({ 
        ...body,
        customerId: quotation.customerId,
        shipmentService: quotation.shipmentService, 
        rfqNumber,
        orderNumber, 
        createdByUserId: user.userId,
        createdByCompanyId: user.companyId,
      })
      quotation.rfqStatus = RfqStatus.COMPLETED

      const bidPrices = await this.bidPriceRepo
        .createQueryBuilder('bp')
        .select([
          'bp.priceCompId',
          'bp.priceCompCode',
          'bp.priceCompName',
          'bp.uom',
          'bp.price',
          'bp.total'
        ])
        .innerJoin('bp.bid', 'b')
        .where('b.rfqId = :rfqId AND b.status = :status AND bp.status = :status')
        .setParameters({ rfqId: quotation.id, status: 1 })
        .getMany()

      const sellingPricesValue = []
      bidPrices.forEach((el) => {
        sellingPricesValue.push({
          orderNumber: orderNumber,
          priceComponent: el.priceCompName,
          uom: el.uom,
          price: el.total,
          qty: 0,
          vat: 0,
          total: 0,
          createdByUserId: user.userId,
        })
      })
      const sellingPrices = this.shipmentSellingPriceRepo.create(sellingPricesValue)

      // progression revenue (only once) //

      const finalAmount = sellingPrices.reduce((acc, el) => {
        if (el.priceComponent.toLowerCase() !== 'reimbursement'){
          return acc + +el.price
        }
        return acc + 0
      }, 0)

      const revenueBody = {
        customerId: shipment.customerId,
        orderNumber,
        otifStatus: OtifStatus.BOOKED,
        kind: RevenueKind.PROGRESSION,
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 1).toString(),
        initialAmount: 0,
        finalAmount: +finalAmount,
        adjustmentAmount: 0,
        progressionPercentage: 100,
        progress: 100,
        progressionAmount: +finalAmount,
        settled: +finalAmount,
        remaining: 0,
        shipmentService: quotation.shipmentService,
        rfqNumber,
        affiliation: user.affiliation
      }
      const revenue = this.revenueRepo.create(revenueBody)

      return await this.connection.transaction(async (entityManager) => {
        await entityManager.save(quotation)
        await entityManager.save(sellingPrices)
        const result = await entityManager.save(shipment)
        await entityManager.save(revenue)
        return result
      })

    } catch (error) {
      throw error
    }
  }

  async update(user: User, orderNumber: string, body: UpdateShipmentDto) {
    const shipment = await this.shipmentRepo.findOne({ 
      orderNumber, 
      createdByCompanyId: user.companyId, 
      status: 1 
    })
    if (!shipment) {
      throw new NotFoundException('Shipment not found')
    }

    Object.assign(shipment, body, { updatedByUserId: user.userId })

    return await this.shipmentRepo.save(shipment)
  }

  async getPaged(
    user: User, 
    page: number, 
    perpage: number, 
    shipmentStatus: ShipmentStatus, 
    shipmentVia: ShipmentVia, 
    search: string, 
    createdAt: string
  ) {
    const limit = perpage;
    const offset = limit * (page - 1)

    let query = await this.shipmentRepo
      .createQueryBuilder('s')
      .where('s.status = :status AND s.createdByCompanyId = :companyId')
      .innerJoinAndSelect('s.customer', 'c', 'c.affiliation = :affiliation AND c.companyId = :companyId')
      .innerJoinAndSelect('s.quotation', 'q', 'q.status = :status AND q.createdByCompanyId = :companyId')
      .select([
        's.orderNumber',
        's.shipmentStatus',
        's.otifStatus',
        'c.companyName',
        'q.rfqNumber',
        'q.shipmentVia',
        'q.shipmentService',
        'q.shipmentType',
        'q.shipmentDate', // transaction date
        'q.countryFrom',
        'q.cityFrom',
        'q.countryTo',
        'q.cityTo',
        'q.rfqStatus',
      ])
      .setParameters({ 
        'affiliation': user.affiliation, 
        'companyId': user.companyId, 
        'status': 1 
      })
      .orderBy('s.updatedAt', 'DESC')
      
      if (shipmentStatus) {
        query.andWhere('s.shipmentStatus = :shipmentStatus', { shipmentStatus })
      }

      if (shipmentVia) {
        query.andWhere('q.shipmentVia = :shipmentVia', { shipmentVia })
      }

      if (search) {
        query.andWhere(
          new Brackets((qb) => {
            qb.where('q.rfqNumber like :search')
              .orWhere('q.countryFrom like :search')
              .orWhere('q.cityFrom like :search')
              .orWhere('q.countryTo like :search')
              .orWhere('q.cityTo like :search')
              .orWhere('q.shipmentService like :search')
              .orWhere('q.shipmentType like :search')
              .orWhere('c.companyName like :search')
              .orWhere('s.orderNumber like :search')
          })
        ).setParameter('search', `%${search}%`)
      }

      if (createdAt) {
        const from = createdAt.split('to')[0];
        const until = createdAt.split('to')[1];
        query.andWhere(
          `(DATE(q.shipmentDate) >= :from AND DATE(q.shipmentDate) <= :until)`,
          { from, until },
        );
      }

      const shipments = await query.getMany()
      const totalRecord = shipments.length;
    
      const data = await query.offset(offset).limit(limit).getMany()
      const totalShowed = data.length;

      return {
        page,
        totalRecord,
        totalShowed,
        totalPage: Math.ceil(totalRecord / limit),
        showing: `${totalRecord === 0 ? 0 : offset + 1} - ${offset + totalShowed} of ${totalRecord}`,
        next: offset + totalShowed !== totalRecord,
        data,
      };
  }

  async getDetail(user: User, orderNumber: string) {
    const shipment = await this.shipmentRepo
      .createQueryBuilder('s')
      .where('s.orderNumber = :orderNumber AND s.status = :status AND s.createdByCompanyId = :companyId')
      .innerJoinAndSelect('s.customer', 'c', 'c.companyId = :companyId AND c.affiliation = :affiliation')
      .innerJoinAndSelect('s.quotation', 'q', 'q.status = :status AND s.createdByCompanyId = :companyId')
      .leftJoinAndSelect('q.quotationFiles', 'quotationFiles')
      .leftJoinAndSelect('s.shipmentOtifs', 'o', 'o.status = :status')
      .leftJoinAndSelect('s.shipmentFiles', 'shipmentFiles')
      .leftJoin('s.invoice', 'i')
      .setParameters({ 
        'orderNumber': orderNumber, 
        'affiliation': user.affiliation, 
        'companyId': user.companyId, 
        'status': 1 
      })
      .addSelect('i.invoiceStatus')
      .getOne()

    if (!shipment) {
      throw new NotFoundException('Shipment not found')
    }

    const status = {
      rfqNumber: shipment.rfqNumber,
      rfqStatus: shipment.quotation.rfqStatus,
      orderNumber: shipment.orderNumber, 
      shipmentStatus: shipment.shipmentStatus,
      otifStatus: shipment.otifStatus,

      shipmentVia: shipment.quotation.shipmentVia,
      shipmentType: shipment.quotation.shipmentType,
      shipmentService: shipment.quotation.shipmentService,
      shipmentDate: shipment.quotation.shipmentDate,
      countryFrom: shipment.quotation.countryFrom,
      cityFrom: shipment.quotation.cityFrom,
      addressFrom: shipment.quotation.addressFrom,
      countryTo: shipment.quotation.countryTo,
      cityTo: shipment.quotation.cityTo,
      addressTo: shipment.quotation.addressTo,

      shipmentOtifs: [ { 
        otifStatus: "BOOKED",
        updatedAt: format(shipment.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      }, ...this.helper.mapOtifResponse(shipment.shipmentOtifs) ],
    } 

    const details = {
      // carrier information
      shippingLine: shipment.shippingLine,
      vendor: shipment.vendor,
      masterBl: shipment.masterBl,
      masterBlType: shipment.masterBlType,
      houseBl: shipment.houseBl,
      houseBlType: shipment.houseBlType,
      terms: shipment.terms,
      // shipping
      customer: {
        customerId: shipment.customerId,
        companyName: shipment.customer.companyName,
        fullName: shipment.customer.fullName,
      },
      rfqNumber: shipment.quotation.rfqNumber,
      shipmentVia: shipment.quotation.shipmentVia,
      shipmentService: shipment.quotation.shipmentService,
      countryFrom: shipment.quotation.countryFrom,
      cityFrom: shipment.quotation.cityFrom,
      addressFrom: shipment.quotation.addressFrom,
      zipcodeFrom: shipment.quotation.zipcodeFrom,
      countryTo: shipment.quotation.countryTo,
      cityTo: shipment.quotation.cityTo,
      addressTo: shipment.quotation.addressTo,
      zipcodeTo: shipment.quotation.zipcodeTo,
      customerPosition: shipment.quotation.customerPosition,
      routeType: shipment.quotation.routeType,
      shipmentDate: shipment.quotation.shipmentDate,
      // shipment type
      shipmentType: shipment.quotation.shipmentType,
      packingList: shipment.quotation.packingList,
      containerType: shipment.quotation.containerType,
      containerOption: shipment.quotation.containerOption,
      // product type
      productType: shipment.quotation.productType,
      kindOfGoods: shipment.quotation.kindOfGoods,
      valueOfGoods: shipment.quotation.valueOfGoods, 
      hsCode: shipment.quotation.hsCode,
      poNumber: shipment.quotation.poNumber, 
      unNumber: shipment.quotation.unNumber,
      description: shipment.quotation.description,
      quotationFiles: this.helper.mapFileResponse(shipment.quotation.quotationFiles),
      // additional
      remark: shipment.quotation.remark,
      originCustomsClearance: shipment.quotation.originCustomsClearance,
      destinationCustomsClearance: shipment.quotation.destinationCustomsClearance,
      estimateStorage: shipment.quotation.estimateStorage,
      // shipper details
      shipperName: shipment.shipperName,
      shipperCompany: shipment.shipperCompany,
      shipperPhoneCode: shipment.shipperPhoneCode,
      shipperPhone: shipment.shipperPhone,
      shipperTaxId: shipment.shipperTaxId,
      shipperEmail: shipment.shipperEmail,
      shipperZipCode: shipment.shipperZipCode,
      shipperAddress: shipment.shipperAddress,
      //consignee details
      consigneeName: shipment.consigneeName,
      consigneeCompany: shipment.consigneeCompany,
      consigneePhoneCode: shipment.consigneePhoneCode,
      consigneePhone: shipment.consigneePhone,
      consigneeTaxId: shipment.consigneeTaxId,
      consigneeEmail: shipment.consigneeEmail,
      consigneeZipCode: shipment.consigneeZipCode,
      consigneeAddress: shipment.consigneeAddress,
    } 

    return { 
      invoiceStatus: shipment?.invoice?.invoiceStatus,
      status, 
      details, 
      documents: this.helper.mapFileResponse(shipment.shipmentFiles) 
    }
  }

  async getOneCheck(payload: object) {
    return await this.shipmentRepo.findOne({ ...payload }, { select: ['id'] })
  }

}
