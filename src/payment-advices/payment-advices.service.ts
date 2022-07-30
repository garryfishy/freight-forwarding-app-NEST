import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Connection, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaymentAdviceDto } from './dtos/payment-advice.dto';
import { PaymentAdvice } from './entities/payment-advice.entity';
import { Bank } from '../banks/entities/bank.entity';
import { Currency } from '../currencies/entities/currency.entity';
export class PaymentAdvicesService{
    constructor(
        @InjectRepository(Bank) private bankRepo:Repository<Bank>,
        @InjectRepository(Currency) private currencyRepo:Repository<Currency>,
        @InjectRepository(PaymentAdvice) private adviceRepo:Repository<PaymentAdvice>,
        private connection: Connection,
    ){}

    async submit(user: User, body: PaymentAdviceDto, id?: number){
        try {
            const { bankName, currencyName } = body
            let paymentAdvice;

            if (id){
                paymentAdvice = await this.adviceRepo.findOne({ 
                    id,
                    companyId: user.companyId, 
                    status: 1 
                })
                if (!paymentAdvice) {
                    throw new NotFoundException('Payment Advice not found')
                }
            }

            return await this.connection.transaction(async (entityManager) => {
                const bank = await this.bankRepo.findOne({ 
                    where: { name: bankName, companyId: user.companyId, status: 1 }, 
                    select: ['id']
                })
                if (!bank) {
                    const newBank = this.bankRepo.create({ 
                        name: bankName, 
                        companyId: user.companyId,
                        createdByUserId: user.userId, 
                    })
                    await entityManager.save(newBank)
                }

                const currency = await this.currencyRepo.findOne({
                    where: { name: currencyName, companyId: user.companyId, status: 1 }, 
                    select: ['id']
                })
                if (!currency) {
                    const newCurrency = this.currencyRepo.create({ 
                        name: currencyName, 
                        companyId: user.companyId,
                        createdByUserId: user.userId, 
                    })
                    await entityManager.save(newCurrency)
                }

                if (id){
                    Object.assign(paymentAdvice, body, { updatedByUserId: user.userId })
                    return await entityManager.save(paymentAdvice)                       
                } else {
                    paymentAdvice = this.adviceRepo.create({
                        ...body,
                        companyId: user.companyId,
                        createdByUserId: user.userId,
                    })
                    return await entityManager.save(paymentAdvice)
                }
            })
        } catch (error) {
            throw error
        }
    }

    async delete(user: User, id: number){
        try {
            const paymentAdvice = await this.adviceRepo.findOne({ 
                id,
                companyId: user.companyId, 
                status: 1 
            })
            if (!paymentAdvice) {
                throw new NotFoundException('Payment Advice not found')
            }

            paymentAdvice.status = 0;
            paymentAdvice.deletedByUserId = user.userId;
            paymentAdvice.deletedAt = new Date();

            return await this.adviceRepo.save(paymentAdvice)
        } catch (error) {
            throw error            
        }
    }
}