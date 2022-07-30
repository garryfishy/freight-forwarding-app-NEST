import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bank } from 'src/banks/entities/bank.entity';
import { Currency } from 'src/currencies/entities/currency.entity';
import { PaymentAdvice } from './entities/payment-advice.entity';
import { PaymentAdvicesService } from './payment-advices.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Bank, Currency, PaymentAdvice]),
  ],
  providers: [PaymentAdvicesService],
  exports: [PaymentAdvicesService]
})
export class PaymentAdvicesModule {}
