import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { InvoiceStatus, OtifStatus, RevenueKind, ShipmentStatus } from 'src/enums/enum'
import { Invoice } from 'src/invoices/entities/invoice.entity'
import { RevenuesService } from 'src/revenues/revenues.service'
import { Shipment } from 'src/shipments/entities/shipment.entity'
import { User } from 'src/users/entities/user.entity'
import { Connection, Repository } from 'typeorm'
import { SubmitSellingPriceDto } from './dtos/submit-selling-price.dto'
import { ShipmentSelllingPrice } from './entities/shipment-selling-price.entity'

@Injectable()
export class ShipmentSellingPricesService {
  constructor(
    @InjectRepository(ShipmentSelllingPrice) private shipmentSellingPriceRepo: Repository<ShipmentSelllingPrice>,
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    private revenuesService: RevenuesService,
    private connection: Connection,
  ) {}

  async submit(user: User, orderNumber: string, body: SubmitSellingPriceDto) {
    const invoice = await this.invoiceRepo
      .findOne({ where: { orderNumber, status: 1 }, select: ['id', 'invoiceStatus'] })
    if (invoice && invoice.invoiceStatus !== InvoiceStatus.PENDING) {
      throw new BadRequestException('Only allow update price as the invoice is pending')
    }

    const { userId, companyId, affiliation } = user 

    const shipment = await this.shipmentRepo.findOne({ 
      orderNumber,
      status: 1,
      createdByCompanyId: companyId 
    })
    if (!shipment) {
      throw new NotFoundException('Shipment not found')
    }
    if (shipment.shipmentStatus === ShipmentStatus.FAILED) {
      throw new BadRequestException('Your Shipment has been Failed')
    }

    const previousSellingPrices = await this.shipmentSellingPriceRepo.find({ orderNumber })
    previousSellingPrices.forEach((el) => el.status = 0)

    const sellingPricesValue = [] 
    body.sellingPrices.forEach(el => {
      sellingPricesValue.push({ 
        ...el, 
        orderNumber, 
        createdByUserId: userId, 
      })
    })
    const sellingPrices = this.shipmentSellingPriceRepo.create(sellingPricesValue)

    return await this.connection.transaction(async (entityManager) => {
      
      // adjustment revenue //

      const finalAmount = sellingPrices.reduce((acc, el) => {
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
        customerId: shipment.customerId,
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
        rfqNumber: shipment.rfqNumber,
        affiliation
      }
      const revenue = await this.revenuesService.create(revenueBody)

      await entityManager.save(revenue)
      
      await entityManager.save(previousSellingPrices) // soft delete
      return await this.shipmentSellingPriceRepo.save(sellingPrices)
    })
  }

  async getAll(orderNumber: string) {
    return await this.shipmentSellingPriceRepo.find({ orderNumber, status: 1 })
  }

  async getTotalPrice(orderNumber: string) {
    return await this.shipmentSellingPriceRepo
      .createQueryBuilder('p')
      .select('SUM(p.total)', 'finalAmount')
      .where('p.orderNumber = :orderNumber AND p.status = :status AND NOT p.priceComponent = :value')
      .setParameters({ orderNumber, status: 1, value: 'reimbursement' })
      .getRawOne()
  }

}