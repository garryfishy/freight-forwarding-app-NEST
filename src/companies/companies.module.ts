import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesService } from './companies.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([Company]),
    RedisModule,
  ],
  providers:[CompaniesService],
  exports: [CompaniesService]
})
export class CompaniesModule {}
