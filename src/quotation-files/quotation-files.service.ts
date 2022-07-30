import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm';
import { S3Service } from 'src/upload-s3/upload-s3.service';
import { Connection, Repository } from 'typeorm';
import { QuotationFile } from './entities/quotation-file.entity';

@Injectable()
export class QuotationFilesService {
  constructor(
    private s3Service: S3Service,
    @InjectRepository(QuotationFile) private quotationFileRepo: Repository<QuotationFile>,
    private connection: Connection,
  ) {}
  
  async update(userId: number, rfqNumber: string, deletedFiles: string, uploads: any){
    return await this.connection.transaction(async (entityManager) => {
      await this.s3Service.uploadFiles(uploads)
      
      const files = []
      const fileContainer = 'saas';
      for (let upload of uploads) {
        const fileName = upload.hashedFileName
        files.push({
          rfqNumber,
          fileContainer,
          fileName,
          originalName: upload.file.originalname,
          createdByUserId: userId,
          url: `${process.env.URL_S3}/${fileContainer}/${fileName}`,
        })
      }
      const newFiles = this.quotationFileRepo.create(files)
      const uploadedFiles =  await entityManager.save(newFiles)
      
      let destroyedFiles
      if (deletedFiles?.length) {
        const ids = JSON.parse(deletedFiles)
        const quotationFiles = await this.quotationFileRepo.findByIds(ids)

        const fileNames = []
        for (let file of quotationFiles) {
          fileNames.push(file.fileName)
        }
        await this.s3Service.deleteFiles(fileNames)
        
        destroyedFiles = await entityManager.remove(quotationFiles)
      }
        
      if (!uploads.length) {
        return destroyedFiles
      }
      return uploadedFiles
      
    })
  }

}