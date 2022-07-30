import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

@Module({
  providers: [CustomersService],
  exports: [CustomersService],
  imports:[
    TypeOrmModule.forFeature([User, Company, Customer]),
  ],
})
export class CustomersModule {}
