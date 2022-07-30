import { Injectable, Res } from '@nestjs/common';

import { PDFService } from '@t00nday/nestjs-pdf';

@Injectable()
export class CreatePDFService {
  constructor(private pdfService: PDFService) {}

  async quotationPDF(data) {
    try {
        return await this.pdfService.toStream('quotation', {locals: {data}}).toPromise();
    } catch (error) { 
      throw error;
    }
  }

  async invoicePDF(data){
    try {
      return await this.pdfService.toStream('invoice', {locals: {data}}).toPromise();
    } catch (error) {
      throw error
    }
  }

  async PDFToBuffer(data){
    try {
      return await this.pdfService.toBuffer('quotation', {locals: {data}}).toPromise()      
    } catch (error) {
      throw error
    }
  }
}
