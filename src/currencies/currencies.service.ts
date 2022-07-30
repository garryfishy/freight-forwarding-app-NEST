import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CurrenciesService {
    constructor(
        @InjectRepository(Currency) private currencyRepo: Repository<Currency>
    ){}

    async findAll(companyId: number){
        try {
            return await this.currencyRepo.find({ status: 1, companyId })
        } catch (error) {
            throw error                       
        }
    }
}
