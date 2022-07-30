import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { BidsService } from 'src/bids/bids.service';
import { CronService } from 'src/cron/cron.service';
import { Customer } from 'src/customers/entities/customer.entity';
import { OtifStatus, RevenueKind, ShipmentStatus } from 'src/enums/enum';
import { Helper } from 'src/helpers/helper';
import { Invoice } from 'src/invoices/entities/invoice.entity';
import { MailService } from 'src/mail/mail.service';
import { RevenuesService } from 'src/revenues/revenues.service';
import { ShipmentSellingPricesService } from 'src/shipment-selling-prices/shipment-selling-prices.service';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { User } from 'src/users/entities/user.entity';
import { Connection, Repository } from 'typeorm';
import { SubmitShipmentOtifDto } from './dtos/submit-shipment-otif.dto';
import { ShipmentOtif } from './entities/shipment-otif.entity';

@Injectable()
export class ShipmentOtifsService {
  constructor(
    @InjectRepository(ShipmentOtif) private shipmentOtifRepo: Repository<ShipmentOtif>,
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    private readonly helper: Helper,
    private connection: Connection,
    private readonly mailService: MailService,
    private revenuesService: RevenuesService,
    private shipmentSellingPricesService: ShipmentSellingPricesService,
    private bidsService: BidsService,
    private cronService: CronService,
  ) {}
  
  async create(user: User, orderNumber: string, body: SubmitShipmentOtifDto) {
    const shipment = await this.shipmentRepo.findOne({ 
      orderNumber,
      status: 1,
      createdByCompanyId: user.companyId 
    })
    if (!shipment) {
      throw new NotFoundException('Shipment not found')
    }

    const invoice = await this.invoiceRepo.findOne({ orderNumber, status: 1 })

    const [ otifStatus, shipmentStatus ] = this.helper.checkOtif(
      shipment.shipmentService, 
      shipment.otifStatus, 
      body.otifStatus,
      invoice?.invoiceStatus
    )

    shipment.shipmentStatus = shipmentStatus;
    shipment.otifStatus = otifStatus;
    
    const payload = this.helper.mapOtifBody(otifStatus, body)

    const shipmentOtif = await this.shipmentOtifRepo.create({ 
      ...payload,
      otifStatus,
      orderNumber, 
      createdByUserId: user.userId 
    })
    
    const result = await this.connection.transaction(async (entityManager) => {
      await entityManager.save(shipment)

      if (otifStatus === OtifStatus.REJECTED || otifStatus === OtifStatus.CANCELLED) {
        if (invoice) {
          invoice.status = 0
          invoice.deletedByUserId = user.userId
          invoice.deletedAt = new Date()
          await entityManager.save(invoice)
        }

         // adjustment revenue (revert revenue from current shipment) //

        const previousRevenueDetail = await this.revenuesService.getPreviousRevenueDetail(orderNumber)
    
        let previousFinalAmount = previousRevenueDetail?.finalAmount ?? 0
    
        const initialAmount = +previousFinalAmount
        const adjustmentAmount = 0 - initialAmount 
    
        const revenueBody = {
          customerId: shipment.customerId,
          orderNumber,
          otifStatus: shipment.otifStatus,
          kind: RevenueKind.ADJUSTMENT,
          year: new Date().getFullYear().toString(),
          month: (new Date().getMonth() + 1).toString(),
          initialAmount,
          finalAmount: 0,
          adjustmentAmount,
          progressionPercentage: 0,
          progress: 100,
          progressionAmount: 0,
          settled: 0,
          remaining: 0,
          shipmentService: shipment.shipmentService,
          rfqNumber: shipment.rfqNumber,
          affiliation: user.affiliation
        }
        const revenue = await this.revenuesService.create(revenueBody)

        await entityManager.save(revenue)

      }

      return await entityManager.save(shipmentOtif)
    })

    const customer = await this.customerRepo.findOne(
      { customerId: shipment.customerId }, 
      { select: ['userAffiliation', 'companyName', 'email'] }
    )

    const mailBody = {
      companyName: customer.companyName,
      email: customer.email,
      orderNumber,
      rfqNumber: shipment.rfqNumber,
      shipmentVia: orderNumber.split('-').pop()[1] === '1' ? 'Ocean' : 'Air',
      masterBl: shipment.masterBl,
      otifStatus,
      // detailStatus: payload ???
      ...payload
    }
    // await this.mailService.sendOtifNotification(mailBody)

    /*
    // progression revenue //
    
    const finalAmount = await this.bidsService.getTotalPrice(shipment.rfqNumber)
    // const { finalAmount } = await this.shipmentSellingPricesService.getTotalPrice(orderNumber)
    const previousRevenueDetail = await this.revenuesService.getPreviousRevenueDetail(orderNumber)

    let previousFinalAmount = previousRevenueDetail?.finalAmount ?? finalAmount 
    let previousProgress = previousRevenueDetail?.progress ?? 0

    const progressionPercentage = 100
    // const progressionPercentage = this.helper.getProgressionPercentage(shipment.shipmentService, otifStatus)
    let progressionAmount = +finalAmount * progressionPercentage / 100

    let year = otifStatus === OtifStatus.PICKUP ? body.pickupDate?.split('-')[0] : body.documentDate?.split('-')[0]
    let month = otifStatus === OtifStatus.PICKUP ? body.pickupDate?.split('-')[1] : body.documentDate?.split('-')[1]

    // ??? apakah tidak ada sepeser pun yg masuk ke revenue? karena emg hny bisa failed saat di waiting
    if (otifStatus === OtifStatus.REJECTED || otifStatus === OtifStatus.CANCELLED) {
      progressionAmount = 0 - +finalAmount
      year = `${new Date().getFullYear()}`
      month = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}` 
    }

    const progress = +previousProgress + progressionPercentage
    const settled = +finalAmount * progress / 100

    const revenueBody = {
      customerId: shipment.customerId,
      orderNumber,
      otifStatus,
      kind: RevenueKind.PROGRESSION,
      year,
      month,
      initialAmount: +previousFinalAmount,
      finalAmount: +finalAmount,
      adjustmentAmount: 0,
      progressionPercentage,
      progress,
      progressionAmount,
      settled,
      remaining: +finalAmount - settled,
      shipmentService: shipment.shipmentService,
      rfqNumber: shipment.rfqNumber,
      affiliation: customer.userAffiliation
    }
    const revenue = await this.revenuesService.create(revenueBody)
    */

    if (otifStatus === OtifStatus.SCHEDULED) {
      const cronPayload = {
        rfqNumber: shipment.rfqNumber,
        etdDate: `${body.etd} ${body.etdTime.split(' ')[0]}`,
        etdTimeZone: body.etdTime.split(' ')[1],
        etaDate: `${body.eta} ${body.etaTime.split(' ')[0]}`,
        etaTimeZone: body.etaTime.split(' ')[1]
      }
      this.cronService.addSchedule(cronPayload)
    }

    return result
  }

  async update(userId: number, fullName: string, orderNumber: string, body: SubmitShipmentOtifDto) {
    const shipment = await this.shipmentRepo
      .createQueryBuilder('s')
      .where(
       `s.orderNumber = :orderNumber
        AND s.status = :status`
      )
      .setParameters({
        orderNumber, 
        status: 1,
      })
      .select(['s.shipmentStatus', 's.rfqNumber'])
      .getOne()

    if (shipment.shipmentStatus === ShipmentStatus.FAILED || 
      shipment.shipmentStatus === ShipmentStatus.COMPLETE
    ) {
      throw new BadRequestException(`Your Shipment has been ${shipment.shipmentStatus.toLowerCase()}`)
    }

    const shipmentOtif = await this.shipmentOtifRepo.findOne({ 
      orderNumber, 
      otifStatus: body.otifStatus,
      status: 1
    })
    if (!shipmentOtif) {
      throw new NotFoundException('Shipment Otif not found')
    }

    let previousSchedule
    if (body.otifStatus === OtifStatus.SCHEDULED) {
      previousSchedule = {
        etd: `${shipmentOtif.etd} ${shipmentOtif.etdTime}`,
        eta: `${shipmentOtif.eta} ${shipmentOtif.etaTime}`
      }
    }

    const updatedShipmentOtif = this.helper.mapOtifBody(body.otifStatus, body)

    Object.assign(shipmentOtif, updatedShipmentOtif, { updatedByUserId: userId })

    // update year and/or month revenue //

    const revenue = await this.revenuesService.getAll({ orderNumber, otifStatus: body.otifStatus }) 
    revenue.forEach(el => {
      if (body.otifStatus === OtifStatus.PICKUP) {
        el.year = body.pickupDate.split('-')[0]
        el.month = body.pickupDate.split('-')[1]
      } else {
        el.year = body.documentDate.split('-')[0]
        el.month = body.documentDate.split('-')[1]
      }
    }) 

    const result = await this.connection.transaction(async (entityManager) => {
      await entityManager.save(revenue)
      return await entityManager.save(shipmentOtif)
    })

    if (body.otifStatus === OtifStatus.SCHEDULED) {
      const updatedSchedule = {
        etd: `${shipmentOtif.etd} ${shipmentOtif.etdTime}`,
        eta: `${shipmentOtif.eta} ${shipmentOtif.etaTime}`
      }

      const isEtdChanged = updatedSchedule.etd === previousSchedule.etd ? false : true
      const isEtaChanged = updatedSchedule.eta === previousSchedule.eta ? false : true

      const cronPayload = {
        rfqNumber: shipment.rfqNumber,
        etdDate: `${shipmentOtif.etd} ${shipmentOtif.etdTime.split(' ')[0]}`,
        etdTimeZone: shipmentOtif.etdTime.split(' ')[1],
        etaDate: `${shipmentOtif.eta} ${shipmentOtif.etaTime.split(' ')[0]}`,
        etaTimeZone: shipmentOtif.etaTime.split(' ')[1],
      }

      if (userId !== shipmentOtif.createdByUserId && ( isEtdChanged || isEtaChanged )) {
        cronPayload['sendNotifToCreator'] = true
        cronPayload['userIdCreator'] = shipmentOtif.createdByUserId,
        cronPayload['changerFullname'] = fullName,
        cronPayload['previousEtd'] = isEtdChanged ? previousSchedule.etd : null
        cronPayload['previousEta'] = isEtaChanged ? previousSchedule.eta : null
      }

      this.cronService.editSchedule(cronPayload)
    }

    return result
  }

}