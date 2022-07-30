import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm';
import { S3Service } from 'src/upload-s3/upload-s3.service';
import { Repository } from 'typeorm';
import { ShipmentFile } from './entities/shipment-file.entity';

@Injectable()
export class ShipmentFilesService {
  constructor(
    private s3Service: S3Service,
    @InjectRepository(ShipmentFile) private shipmentFileRepo: Repository<ShipmentFile>,
  ) {}

  async create(userId: number, orderNumber: string, upload: any) {
    await this.s3Service.uploadFiles([upload])

    const fileContainer = 'saas';
    const fileName = upload.hashedFileName
    const file = {
      orderNumber,
      fileContainer,
      fileName,
      originalName: upload.file.originalname,
      createdByUserId: userId,
      url: `${process.env.URL_S3}/${fileContainer}/${fileName}` 
    }

    const newFile = this.shipmentFileRepo.create(file)
    return await this.shipmentFileRepo.save(newFile)
  }

  async delete(orderNumber: string, fileId: number){
    const file = await this.shipmentFileRepo.findOne({ id: fileId, orderNumber })
    await this.s3Service.deleteFiles([file.fileName])

    return await this.shipmentFileRepo.remove(file)
  }

}