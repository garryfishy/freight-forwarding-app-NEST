import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidsModule } from 'src/bids/bids.module';
import { BidPrice } from 'src/bids/entities/bid-price.entity';
import { Helper } from 'src/helpers/helper';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { RedisModule } from 'src/redis/redis.module';
import { Revenue } from 'src/revenues/entities/revenue.entity';
import { RevenuesModule } from 'src/revenues/revenues.module';
import { ShipmentFilesModule } from 'src/shipment-files/shipment-files.module';
import { ShipmentOtifsModule } from 'src/shipment-otifs/shipment-otifs.module';
import { ShipmentSelllingPrice } from 'src/shipment-selling-prices/entities/shipment-selling-price.entity';
import { ShipmentSellingPricesModule } from 'src/shipment-selling-prices/shipment-selling-prices.module';
import { Shipment } from './entities/shipment.entity';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Quotation, BidPrice, ShipmentSelllingPrice, Revenue]),
    RedisModule,
    ShipmentFilesModule,
    ShipmentOtifsModule,
    ShipmentSellingPricesModule,
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, Helper],
  exports: [ShipmentsService]
})
export class ShipmentsModule {}
