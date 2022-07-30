import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/redis/redis.module';
import { S3Module } from 'src/upload-s3/upload-s3.module';
import { ShipmentFile } from './entities/shipment-file.entity';
import { ShipmentFilesService } from './shipment-files.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShipmentFile]),
    S3Module,
  ],
  providers: [ShipmentFilesService],
  exports: [ShipmentFilesService],
})
export class ShipmentFilesModule {}
