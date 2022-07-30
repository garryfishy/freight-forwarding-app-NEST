import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidsModule } from 'src/bids/bids.module';
import { CronModule } from 'src/cron/cron.module';
import { Customer } from 'src/customers/entities/customer.entity';
import { Helper } from 'src/helpers/helper';
import { Invoice } from 'src/invoices/entities/invoice.entity';
import { MailModule } from 'src/mail/mail.module';
import { RedisModule } from 'src/redis/redis.module';
import { RevenuesModule } from 'src/revenues/revenues.module';
import { ShipmentSellingPricesModule } from 'src/shipment-selling-prices/shipment-selling-prices.module';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { ShipmentOtif } from './entities/shipment-otif.entity';
import { ShipmentOtifsService } from './shipment-otifs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShipmentOtif, Shipment, Customer, Invoice]),
    RedisModule,
    MailModule,
    RevenuesModule,
    ShipmentSellingPricesModule,
    BidsModule,
    CronModule,
  ],
  providers: [ShipmentOtifsService, Helper],
  exports: [ShipmentOtifsService]
})
export class ShipmentOtifsModule {}