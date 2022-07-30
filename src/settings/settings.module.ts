import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/redis/redis.module';
import { User } from 'src/users/entities/user.entity';
import { PaymentAdvice } from 'src/payment-advices/entities/payment-advice.entity';
import { Company } from 'src/companies/entities/company.entity';
import { SettingsController } from './settings.controller';
import { UsersModule } from 'src/users/users.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { ConfigModule } from '@nestjs/config';
import { PaymentAdvicesService } from 'src/payment-advices/payment-advices.service';
import { Currency } from 'src/currencies/entities/currency.entity';
import { Bank } from 'src/banks/entities/bank.entity';
import { S3Service } from 'src/upload-s3/upload-s3.service';
import { CaslModule } from 'src/casl/casl.module';
import { PaymentAdvicesModule } from 'src/payment-advices/payment-advices.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, PaymentAdvice, Currency, Bank]),
    RedisModule,
    UsersModule,
    CompaniesModule,
    ConfigModule,
    CaslModule,
    PaymentAdvicesModule,
  ],
  controllers: [SettingsController],
  providers: [S3Service],
  exports: []
})
export class SettingsModule {}
