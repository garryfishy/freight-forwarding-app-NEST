import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose'

import { User } from './users/entities/user.entity';
import { Company } from './companies/entities/company.entity';
import { Bank } from './banks/entities/bank.entity';
import { Currency } from './currencies/entities/currency.entity';

import { RedisModule } from './redis/redis.module'
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { PaymentAdvicesModule } from './payment-advices/payment-advices.module';
import { BanksModule } from './banks/banks.module';
import { PaymentAdvice } from './payment-advices/entities/payment-advice.entity';
import { SettingsModule } from './settings/settings.module';
import { BidsModule } from './bids/bids.module';
import { QuotationsModule } from './quotations/quotations.module';
import { Quotation } from './quotations/entities/quotation.entity';
import { QuotationFilesModule } from './quotation-files/quotation-files.module';
import { QuotationFile } from './quotation-files/entities/quotation-file.entity';

import { Bid } from './bids/entities/bid.entity';
import { BidPrice } from './bids/entities/bid-price.entity';
import { PriceComponent } from './price-components/entities/price-component.entity';
import { OriginDestination } from './origin-destination/entities/origin-destination.entity';
import { Country } from './origin-destination/entities/country.entity';
import { MasterdataModule } from './masterdata/masterdata.module';
import { CustomersModule } from './customers/customers.module';
import { OriginDestinationModule } from './origin-destination/origin-destination.module';
import { PriceComponentsModule } from './price-components/price-components.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { Customer } from './customers/entities/customer.entity';
import { S3Module } from './upload-s3/upload-s3.module';
import { PhoneCode } from './phone-codes/entities/phone-code.entity';
import { PhoneCodesModule } from './phone-codes/phone-codes.module';
import { Shipment } from './shipments/entities/shipment.entity';
import { ShipmentsModule } from './shipments/shipments.module';
import { ShipmentOtif } from './shipment-otifs/entities/shipment-otif.entity';
import { ShipmentOtifsModule } from './shipment-otifs/shipment-otifs.module';
import { AccessRoleModule } from './access-role/access-role.module';
import { Menu } from './access-role/entities/menu';
import { Role } from './access-role/entities/role.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { ShipmentFile } from './shipment-files/entities/shipment-file.entity';
import { ShipmentFilesModule } from './shipment-files/shipment-files.module';
import { ShipmentType } from './shipment-types/entities/shipment-type.entity';
import { ShipmentTypesModule } from './shipment-types/shipment-types.module';
import { PackagingType } from './packaging-types/entities/packaging-type.entity';
import { PackagingTypesModule } from './packaging-types/packaging-types.module';
import { KindOfGoods } from './kind-of-goods/entities/kind-of-goods.entity';
import { KindOfGoodsModule } from './kind-of-goods/kind-of-goods.module';
import { FclType } from './fcl-types/entities/fcl-type.entity';
import { FclTypesModule } from './fcl-types/fcl-types.module';
import { ShipmentSelllingPrice } from './shipment-selling-prices/entities/shipment-selling-price.entity';
import { ShipmentSellingPricesModule } from './shipment-selling-prices/shipment-selling-prices.module';
import { Revenue } from './revenues/entities/revenue.entity';
import { RevenuesModule } from './revenues/revenues.module';
import { CreatePDFModule } from './create-pdf/create-pdf.module';
import { CaslModule } from './casl/casl.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PortsModule } from './ports/ports.module';
import { Port } from './ports/entities/port.entity';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { Invoice } from './invoices/entities/invoice.entity';
import { InvoicesModule } from './invoices/invoices.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env`],
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        synchronize: false, // do NOT set to true!
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [
          User, 
          Company,
          PriceComponent,
          Quotation,
          OriginDestination,
          Country,
          QuotationFile,
          Bid,
          BidPrice,
          Bank,
          Currency,
          PaymentAdvice,
          Customer,
          PhoneCode,
          Shipment,
          ShipmentOtif,
          Menu,
          Role,
          ShipmentFile,
          ShipmentType,
          PackagingType,
          KindOfGoods,
          FclType,
          ShipmentSelllingPrice,
          Revenue,
          Port,
          Invoice,
        ],
      }),
    }),
    RedisModule,
    UsersModule,
    AuthModule,
    MasterdataModule,
    CustomersModule,
    OriginDestinationModule,    
    PaymentAdvicesModule,
    PriceComponentsModule,
    BanksModule,
    MailModule,
    SettingsModule,
    BidsModule,
    QuotationsModule,
    QuotationFilesModule,
    WhatsappModule,
    CurrenciesModule,
    S3Module,
    PhoneCodesModule,
    ShipmentsModule,
    ShipmentOtifsModule,
    AccessRoleModule,
    ShipmentFilesModule,
    ShipmentTypesModule,
    PackagingTypesModule,
    KindOfGoodsModule,
    FclTypesModule,
    ShipmentSellingPricesModule,
    RevenuesModule,
    CreatePDFModule,
    DashboardModule,
    CaslModule,
    PortsModule,
    InvoicesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*')
  }
}
