import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Quotation } from "./entities/quotation.entity";
import { format } from 'date-fns'
import { CreateQuotationDto } from "./dtos/create-quotation.dto";
import { UpdateQuotationDto } from "./dtos/update-quotation.dto";
import { RfqStatus, ShipmentService, ShipmentType } from 'src/enums/enum';
import { Bid } from "src/bids/entities/bid.entity";
import { Company } from "src/companies/entities/company.entity"
import { _ } from 'lodash';
import { User } from "src/users/entities/user.entity";
import { BidPrice } from "src/bids/entities/bid-price.entity";
import { OriginDestinationService } from "src/origin-destination/origin-destination.service";
import { Shipment } from "src/shipments/entities/shipment.entity"
import { CreatePDFService } from "src/create-pdf/create-pdf.service";
import { S3Service } from "src/upload-s3/upload-s3.service";
@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(Quotation) private quotationRepo: Repository<Quotation>,
    private readonly originDestinationService: OriginDestinationService,
    private createPDFService: CreatePDFService,
    private s3Service: S3Service,
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
  ) {}

  async create(userId: number, companyId: number, body: CreateQuotationDto) {
    const clientId = `${companyId}`.padStart(4, '0');
    const currentDate = format(new Date(), 'yyyyMMdd');
    const origin = await this.originDestinationService.getCityCode(body.cityFrom)
    const destination = await this.originDestinationService.getCityCode(body.cityTo)

    let rfqNumber = `RFQ/${clientId}/${currentDate}-${origin.cityCode}-${destination.cityCode}-`
    
    const quotation = await this.quotationRepo
      .createQueryBuilder('q')
      .select(['q.id', 'q.rfqNumber'])
      .where('q.createdByCompanyId = :createdByCompanyId AND q.status = :status')
      .setParameters({ 'createdByCompanyId': companyId, 'status': 1 })
      .orderBy('q.id', 'DESC')
      .getOne();

    if (quotation) {
      const nextNumber = +quotation.rfqNumber.split('-').pop() + 1
      rfqNumber += `${nextNumber}`.padStart(4, '0')
    } else {
      rfqNumber += '0001'
    }

    const newQuotation = await this.quotationRepo.create({
      ...body,
      rfqNumber,
      createdByCompanyId: companyId,
      createdByUserId: userId,
    })

    let totalQty = 0
    let estimatedTotalWeight = 0
    let volumetric = 0
    
    const denumerator = body.shipmentType === ShipmentType.AIRCOURIER ? 5000 : 6000

    body.packingList.forEach((obj) => {
      totalQty += Math.floor(obj.packageQty)
      estimatedTotalWeight += Math.ceil(obj.weight) * Math.floor(obj.packageQty)
      volumetric += obj['length'] * obj.width * obj.height / denumerator * Math.floor(obj.packageQty)
    })
    
    Object.assign(newQuotation, { totalQty, estimatedTotalWeight, volumetric: Math.ceil(volumetric) })

    return await this.quotationRepo.save(newQuotation)
  }

  async update(userId: number, companyId: number, rfqNumber: string, body: UpdateQuotationDto) {
    const payload = { ...body }
    const quotation = await this.quotationRepo.findOne({
      rfqNumber, 
      createdByCompanyId: companyId, 
      status: 1
    })
    if (!quotation) {
      throw new NotFoundException('Quotation not found')
    }
    if (quotation.rfqStatus === RfqStatus.COMPLETED) {
      delete payload.customerId
      delete payload.shipmentVia
      delete payload.shipmentService
      delete payload.countryFrom
      delete payload.cityFrom
      delete payload.countryTo
      delete payload.cityTo
    }

    const newQuotation = Object.assign(quotation, { updatedByUserId: userId })
    
    if (!payload.packingList) {
      delete payload.packingList
      Object.assign(newQuotation, payload)

    } else if (!Array.isArray(payload.packingList)) {
      delete payload.packingList
      Object.assign(newQuotation)

    }else if (!payload.packingList.length) {
      throw new BadRequestException('Packing list must contain at least 1 element')

    } else if (payload.packingList.length) {
      let totalQty = 0
      let estimatedTotalWeight = 0
      let volumetric = 0

      let denumerator = quotation.shipmentType === ShipmentType.AIRCOURIER ? 5000 : 6000
      if (payload.shipmentType) {
        denumerator = payload.shipmentType === ShipmentType.AIRCOURIER ? 5000 : 6000
      }

      payload.packingList.forEach((obj) => {
        totalQty += Math.floor(obj.packageQty)
        estimatedTotalWeight += Math.ceil(obj.weight) * Math.floor(obj.packageQty)
        volumetric += obj['length'] * obj.width * obj.height / denumerator * Math.floor(obj.packageQty)
      })
      
      Object.assign(newQuotation, payload, { totalQty, estimatedTotalWeight, volumetric: Math.ceil(volumetric) })
    } 

    return await this.quotationRepo.save(newQuotation)
  }

  async getDetail(affiliation: string, companyId: number, rfqNumber: string) {
    return await this.quotationRepo
      .createQueryBuilder('q')
      .where(`
        q.rfqNumber = :rfqNumber 
        AND NOT q.rfqStatus = :rfqStatus
        AND q.createdByCompanyId = :companyId 
        AND q.status = :status
      `)
      .leftJoinAndSelect('q.quotationFiles', 'qf')
      .innerJoinAndSelect('q.customer', 'c', 'c.affiliation = :affiliation AND c.companyId = :companyId')
      .select([
        'q',
        'qf.id',
        'qf.fileContainer',
        'qf.fileName',
        'qf.originalName',
        'qf.url',
        'c.customerId',
        'c.companyName',
        'c.fullName',
        'c.npwp',
        'c.address',
      ])
      .setParameters({ 
        rfqNumber,
        rfqStatus: RfqStatus.REJECTED, 
        affiliation, 
        companyId, 
        status: 1 
      })
      .getOne();
  }

  async getPaged(
    page: number,
    perpage: number,
    filter: string,
    sort: string,
    createdAt: string,
    currentUser: User
  ) {
    const limit = perpage;
    const offset = perpage * (page - 1);

    let query = await this.quotationRepo
      .createQueryBuilder('q')
      .where(`
        q.createdByCompanyId = :companyId 
        AND q.status = :status
      `)
      .innerJoinAndSelect('q.customer', 'c', 'c.affiliation = :affiliation AND c.companyId = :companyId')
      .select([
        'q.id',
        'q.rfqStatus',
        'q.rfqNumber',
        'q.createdAt',
        'q.assignedTo',
        'c.companyName',
        'c.affiliation',
      ])
      .setParameters({
        'affiliation': currentUser.affiliation, 
        'companyId': currentUser.companyId, 
        'status': 1 
      })

    if (filter) {
      query = query.andWhere(
        `((q.rfqNumber like :filter) OR (c.companyName like :filter))`,
        { filter: `%${filter}%` },
      );
    }

    if (createdAt) {
      const from = createdAt.split('to')[0];
      const until = createdAt.split('to')[1];
      query = query.andWhere(
        `(DATE(q.createdAt) >= :from AND DATE(q.createdAt) <= :until)`,
        { from, until },
      );
    }

    if (sort && (sort === 'ASC' || sort === 'DESC')) {
      query.orderBy('q.rfqNumber', sort);
    } else {
      query.orderBy('q.updatedAt', 'DESC');
    }

    const allData = await query.getMany();
    const totalRecord = _.size(allData);
    
    const data = await query.limit(limit).offset(offset).getMany();
    const dataStatus = _.map(data, (quotation) => {
      let status: string;

      if (quotation.rfqStatus === RfqStatus.WAITING) {
        status = 'Draft'
      } else if (quotation.rfqStatus === RfqStatus.NEED_APPROVAL) {
        status = 'Need Approval'
      } else if (quotation.rfqStatus === RfqStatus.REJECTED) {
        status = 'Rejected'
      } else if (quotation.rfqStatus === RfqStatus.SUBMITTED || quotation.rfqStatus === RfqStatus.COMPLETED) {
        status = 'Completed'
      }

      return Object.assign(quotation, { status })
    });
    const totalShowed = _.size(data);

    return {
      page,
      totalRecord,
      totalShowed,
      totalPage: Math.ceil(totalRecord / limit),
      showing: `${totalRecord === 0 ? 0 : offset + 1} - ${
        offset + totalShowed
      } of ${totalRecord}`,
      next: offset + totalShowed !== totalRecord,
      data: dataStatus,
    };
  }

  async getPagedManageRequest(
    page: number,
    perpage: number,
    filter: string,
    sort: string,
    createdAt: string,
    currentUser: User,
    requestStatus: string
  ) {
    const limit = perpage;
    const offset = perpage * (page - 1);
    requestStatus = requestStatus.toLowerCase() === 'completed' ? RfqStatus.COMPLETED : requestStatus ==='pending' ? RfqStatus.SUBMITTED : 'all' 

      let query = requestStatus === 'all' ? await this.quotationRepo
      .createQueryBuilder('q')
      .where('q.createdByCompanyId = :companyId AND q.status = :status')
      .innerJoinAndSelect('q.customer', 'c', 'c.affiliation = :affiliation', {
        affiliation: currentUser.affiliation,
      })
      .select([
        'q.id',
        'q.countryFrom',
        'q.countryTo',
        'q.rfqNumber',
        'q.createdAt',
        'c.companyName',
        'q.rfqStatus',
        'c.affiliation',
      ])
      .where('q.rfqStatus IN (:...rfqStatus)')
      .setParameters({
        rfqStatus: [ RfqStatus.SUBMITTED, RfqStatus.COMPLETED ],
        'affiliation': currentUser.affiliation, 
        'companyId': currentUser.companyId, 
        'status': 1 
      })
      : 
      await this.quotationRepo
      .createQueryBuilder('q')
      .where('q.createdByCompanyId = :companyId AND q.status = :status')
      .innerJoinAndSelect('q.customer', 'c', 'c.affiliation = :affiliation', {
        affiliation: currentUser.affiliation,
      })
      .select([
        'q.id',
        'q.countryFrom',
        'q.countryTo',
        'q.rfqNumber',
        'q.createdAt',
        'c.companyName',
        'q.rfqStatus',
        'c.affiliation',
      ])
      .where('q.rfqStatus = :requestStatus', {requestStatus})
      .setParameters({
        'affiliation': currentUser.affiliation, 
        'companyId': currentUser.companyId, 
        'status': 1 
      })

    if (filter) {
      query = query
      .andWhere
      (`((q.rfqNumber like :filter) OR (c.companyName like :filter) OR (q.countryFrom like :filter) OR (q.countryTo like :filter))`,
      { filter: `%${filter}%` })
    }

    if (createdAt) {
      const from = createdAt.split('to')[0];
      const until = createdAt.split('to')[1];
      query = query.andWhere(
        `(DATE(q.createdAt) >= :from AND DATE(q.createdAt) <= :until)`,
        { from, until },
      );
    }

    if (sort && (sort === 'ASC' || sort === 'DESC')) {
      query.orderBy('q.rfqNumber', sort);
    } else {
      query.orderBy('q.createdAt', 'DESC');
    }

    const allData = await query.getMany();
    const totalRecord = _.size(allData);
    
    const data = await query.limit(limit).offset(offset).getMany();
    const dataStatus = _.map(data, (quotation) => Object.assign(quotation, {
      requestStatus: quotation.rfqStatus === RfqStatus.SUBMITTED ? "Pending" : "Completed"
    }));
    const totalShowed = _.size(data);

    return {
      page,
      totalRecord,
      totalShowed,
      totalPage: Math.ceil(totalRecord / limit),
      showing: `${totalRecord === 0 ? 0 : offset + 1} - ${
        offset + totalShowed
      } of ${totalRecord}`,
      next: offset + totalShowed !== totalRecord,
      data: dataStatus,
    };
}
  async getManageRequestDetail(rfqNumber, affiliation, companyId){
    try {

      let query = await this.quotationRepo
      .createQueryBuilder('quotation')
      .where('quotation.rfqNumber = :rfqNumber', {rfqNumber})
      .andWhere('quotation.status = :status', { status: 1 })
      .leftJoinAndSelect('quotation.quotationFiles', 'quotationFiles')
      .innerJoinAndSelect('quotation.customer', 'customer')
      .leftJoinAndSelect('quotation.bid', 'bid')
      .leftJoinAndSelect('bid.bidprices', 'bidPrices')
      .andWhere('customer.affiliation = :affiliation', { affiliation })
      .select([
        'quotation',
        'quotationFiles.id',
        'quotationFiles.fileContainer',
        'quotationFiles.fileName', 
        'quotationFiles.originalName',
        'quotationFiles.url',
        'customer',
        'bid',
        'bidPrices',
        'bidPrices.priceComp'
      ])
      .getOne()
      query['requestStatus'] = query.rfqStatus === 'BID_SUBMITTED' ? 'Pending' : 'Completed'

      let quotationNote = await this.companyRepo
      .createQueryBuilder('c')
      .where('c.id = :companyId', {companyId})
      .select(
        ['c.quotationNotes', 'c.name', 'c.npwp', 'c.address', 'c.logo']
      )
      .getOne()

      if(quotationNote.quotationNotes === null || !quotationNote.quotationNotes){
        const quotationNote = [ 'Subject to VAT, Duty & Tax'
        ,'Subject to Space & Container Availability'
        ,'Subject to Carrier Local Charges (both ends)'
        ,'Valid for Genco only/ NON HAZ'
        ,'Subject to Carrier Cancellation Fee/ container; Base on Carrier Tariff']
        query['quotationNote'] = quotationNote
      }else{
        const clone = JSON.parse(JSON.stringify(quotationNote))
        const split = clone.quotationNotes.split('\n')
        query['quotationNote'] = split
      }
      query['company'] = quotationNote
      if(query.rfqStatus === 'COMPLETED'){
        let shipment = await this.shipmentRepo.findOne({rfqNumber: query.rfqNumber})
        query['shipment'] = shipment
      }


      return query      
    } catch (error) {
      throw error
    }
  }

  async getOne(payload: any) {
    return await this.quotationRepo.findOne({ ...payload })
  }

  async getS3Url(rfqNumber:string, user:User){
    try {
      let company = await this.getManageRequestDetail(rfqNumber, user.affiliation, user.companyId)


      let buffer = await this.createPDFService.quotationPDF(company)
      const data = {
        rfqNumber,
        buffer
      }
      let url = await this.s3Service.uploadPDF(data)
      return {url, company}
    } catch (error) {
      throw error 
    }
  }

  async getOneCheck(payload: object) {
    return await this.quotationRepo.findOne({ ...payload }, { select: ['id'] })
  }
  
  async approveOrReject(userId: number, companyId: number, rfqNumber: string, action: string) {
    const quotation = await this.quotationRepo.findOne({ 
      rfqNumber, 
      createdByCompanyId: companyId, 
      status: 1 
    })

    if (quotation.assignedTo !== userId) {
      throw new ForbiddenException('Only can be approved or rejected by assigned person')
    }

    quotation.rfqStatus = action === 'approve' ? RfqStatus.SUBMITTED : RfqStatus.REJECTED
    quotation.updatedByUserId = userId

    return await this.quotationRepo.save(quotation)
    
  }
}

