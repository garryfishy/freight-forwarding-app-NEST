import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidPrice } from 'src/bids/entities/bid-price.entity';
import { Bid } from 'src/bids/entities/bid.entity';
import { Company } from 'src/companies/entities/company.entity';
import { Helper } from 'src/helpers/helper';
import { PDFModule, PDFModuleOptions } from '@t00nday/nestjs-pdf';
import { OriginDestinationModule } from 'src/origin-destination/origin-destination.module';
import { QuotationFilesModule } from 'src/quotation-files/quotation-files.module';
import { RedisModule } from 'src/redis/redis.module';
import { Quotation } from './entities/quotation.entity';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { CreatePDFService } from 'src/create-pdf/create-pdf.service';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { S3Module } from 'src/upload-s3/upload-s3.module';
import { MailModule } from 'src/mail/mail.module';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Quotation, Bid, BidPrice, Company, Shipment]),
    RedisModule,
    S3Module,
    MailModule,
    QuotationFilesModule,
    WhatsappModule,
    OriginDestinationModule,
    PDFModule.registerAsync({
      useFactory: (): PDFModuleOptions => ({
        view: {
          root: './src/create-pdf/templates',
          engine: 'ejs',
        },
      }),
    }),
  ],
  controllers: [QuotationsController],
  providers: [CreatePDFService, QuotationsService,  Helper],
  exports: [],
})
export class QuotationsModule {}