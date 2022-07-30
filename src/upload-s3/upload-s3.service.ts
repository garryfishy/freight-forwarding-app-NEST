import * as AWS from 'aws-sdk'
import { BadRequestException } from '@nestjs/common';
export class S3Service {
  private s3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    });
  }
  async uploadPDF(data: any) {
    try {
      const param = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: data.rfqNumber ? `Quotations-${data.rfqNumber}` : `Invoice-${data.invoiceNumber}`,
        Body: data.buffer,
        ACL: 'private',
        ContentType: 'application/pdf',
        ContentDisposition: 'inline',
      };
      await this.s3.upload(param).promise();
      return `${process.env.URL_S3}/${param.Key}`;
    } catch (error) {
      throw error;
    }
  }

  async uploadPhoto(data: any) {
    try {
      const { file, fileName, mimeType } = data;
      const allowedMimeTypes = [
        'image/png', // png
        'image/jpeg', // .jpg and .jpeg
      ];
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new BadRequestException(
          'Only allows upload png, jpg, or jpeg extention',
        );
      }
      const fileContainer = 'saas';
      const param = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${fileContainer}/${fileName}`,
        Body: file.buffer,
        ACL: 'private',
        ContentType: mimeType,
        ContentDisposition: 'inline',
      };
      await this.s3.upload(param).promise();
      return `${process.env.URL_S3}/${fileContainer}/${fileName}`;
    } catch (error) {
      throw error;
    }
  }

  // upload multiple files
  async uploadFiles(uploads: any): Promise<void> {
    try {
      for (let upload of uploads) {
        const { file, hashedFileName } = upload;
        const mimeType = file.mimetype;
        const fileContainer = 'saas';
        const param = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${fileContainer}/${hashedFileName}`,
          Body: file.buffer,
          ACL: 'private',
          ContentType: mimeType,
          ContentDisposition: 'inline',
        };
        await this.s3.upload(param).promise();
      }
    } catch (error) {
      throw error;
    }
  }

  // delete multiple files
  async deleteFiles(fileNames: string[]): Promise<void> {
    try {
      for (let fileName of fileNames) {
        const fileContainer = 'saas';
        const param = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${fileContainer}/${fileName}`,
        };
        await this.s3.deleteObject(param).promise();
      }
    } catch (error) {
      throw error;
    }
  }

  async downloadFile(name: string, res: any) {
    try {
        const extension = name.split('.').pop()

        let fileType : string;

        if (extension === 'doc') {
          fileType = 'application/msword';
        } else if (extension === 'docx') {
          fileType =
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (extension === 'pdf') {
          fileType = 'application/pdf';
        } else if (extension === 'jpg' || extension === 'jpeg'){
            fileType = 'image/jpeg';
        } else if (extension === 'png'){
            fileType = 'image/png';
        }
        
        res.set('content-type', fileType);
        const param = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `saas/${name}`,
        };
      const fileStream = await this.s3.getObject(param).createReadStream();
      return fileStream.pipe(res);
    } catch (error) {
      throw error;
    }
  }
}