import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { ConfigModule } from '@nestjs/config';
import { CompaniesModule } from 'src/companies/companies.module';
import { Crypto } from 'src/utilities/crypto';
import { MailModule } from 'src/mail/mail.module';
import { RedisModule } from 'src/redis/redis.module';
import { Company } from 'src/companies/entities/company.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([User, Company]),
    CompaniesModule,
    MailModule,
    RedisModule,
    ConfigModule,
  ],
  providers:[UsersService, Crypto],
  controllers:[UsersController],
  exports: [UsersService]
})
export class UsersModule {}
