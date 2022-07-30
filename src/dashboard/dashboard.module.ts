import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { RedisModule } from 'src/redis/redis.module';
import { Revenue } from 'src/revenues/entities/revenue.entity';
import { ShipmentOtif } from 'src/shipment-otifs/entities/shipment-otif.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Helper } from 'src/helpers/helper'

@Module({
  imports: [
    TypeOrmModule.forFeature([Quotation, ShipmentOtif, Revenue, Shipment]), 
    RedisModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, Helper],
})
export class DashboardModule {}
