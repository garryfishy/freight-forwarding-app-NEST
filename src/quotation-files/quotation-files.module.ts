import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/redis/redis.module';
import { S3Module } from 'src/upload-s3/upload-s3.module';
import { QuotationFile } from './entities/quotation-file.entity';
import { QuotationFilesService } from './quotation-files.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuotationFile]),
    S3Module,
  ],
  providers: [QuotationFilesService],
  exports: [QuotationFilesService],
})
export class QuotationFilesModule {}
