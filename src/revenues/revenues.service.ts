import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SubmitRevenueDto } from './dtos/submit-revenue.dto'
import { Revenue } from './entities/revenue.entity'

@Injectable()
export class RevenuesService {
  constructor(
    @InjectRepository(Revenue) private revenueRepo: Repository<Revenue>
  ) {}

  async getPreviousRevenueDetail(orderNumber: string) {
    return await this.revenueRepo
      .createQueryBuilder('r')
      .select([
        'r.finalAmount', 
        'r.progress',
        'r.otifStatus',
        'r.year',
        'r.month',
      ])
      .where('r.orderNumber = :orderNumber', { orderNumber })
      .orderBy('id', 'DESC')
      .getOne()
  }

  async getAll(payload: object) {
    return await this.revenueRepo.find({ ...payload })
  }

  async create(body: SubmitRevenueDto) {
    return await this.revenueRepo.create(body)
  }

}
