import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from 'src/invoices/entities/invoice.entity';
import { RevenuesModule } from 'src/revenues/revenues.module';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { ShipmentSelllingPrice } from './entities/shipment-selling-price.entity';
import { ShipmentSellingPricesService } from './shipment-selling-prices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShipmentSelllingPrice, Shipment, Invoice]),
    RevenuesModule,
  ],
  providers: [ShipmentSellingPricesService],
  exports: [ShipmentSellingPricesService]

})
export class ShipmentSellingPricesModule{}
