import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from 'src/customers/customers.module';
import { CustomersService } from 'src/customers/customers.service';
import { PriceComponent } from 'src/price-components/entities/price-component.entity';
import { PriceComponentsModule } from 'src/price-components/price-components.module';
import { RedisModule } from 'src/redis/redis.module';
import { OriginDestination } from 'src/origin-destination/entities/origin-destination.entity';
import { OriginDestinationModule } from 'src/origin-destination/origin-destination.module';
import { OriginDestinationService } from 'src/origin-destination/origin-destination.service';
import { User } from 'src/users/entities/user.entity';
import { MasterdataController } from './masterdata.controller';
import { Country } from 'src/origin-destination/entities/country.entity';
import { Company } from 'src/companies/entities/company.entity';
import { PriceComponentsService } from 'src/price-components/price-components.service';
import { Customer } from 'src/customers/entities/customer.entity';
import { PhoneCodesModule } from 'src/phone-codes/phone-codes.module';
import { ShipmentTypesModule } from 'src/shipment-types/shipment-types.module';
import { PackagingTypesModule } from 'src/packaging-types/packaging-types.module';
import { KindOfGoodsModule } from 'src/kind-of-goods/kind-of-goods.module';
import { FclTypesModule } from 'src/fcl-types/fcl-types.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { UsersModule } from 'src/users/users.module';
import { PortsModule } from 'src/ports/ports.module';
import { BanksModule } from 'src/banks/banks.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';

@Module({
  controllers: [MasterdataController],
  providers: [],
  imports: [
    CustomersModule,
    OriginDestinationModule,
    PriceComponentsModule,
    RedisModule,
    PhoneCodesModule,
    ShipmentTypesModule,
    PackagingTypesModule,
    KindOfGoodsModule,
    FclTypesModule,
    CompaniesModule,
    UsersModule,
    PortsModule,
    BanksModule,
    CurrenciesModule
  ],
})
export class MasterdataModule {}
