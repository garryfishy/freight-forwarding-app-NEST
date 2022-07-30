import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bank } from 'src/banks/entities/bank.entity';
import { CreatePDFModule } from 'src/create-pdf/create-pdf.module';
import { Helper } from 'src/helpers/helper';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { RedisModule } from 'src/redis/redis.module';
import { RevenuesModule } from 'src/revenues/revenues.module';
import { ShipmentSelllingPrice } from 'src/shipment-selling-prices/entities/shipment-selling-price.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { S3Module } from 'src/upload-s3/upload-s3.module';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { Invoice } from './entities/invoice.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice, 
      Quotation, 
      Shipment, 
      ShipmentSelllingPrice, 
      Bank
    ]),
    RedisModule,
    S3Module,
    CreatePDFModule,
    RevenuesModule,
    WhatsappModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, Helper],
})
export class InvoicesModule {}