import { BadRequestException, Body, Controller, NotFoundException, Param, Post, Put, UploadedFile, UseGuards, UseInterceptors, Get, Patch, Query, ParseIntPipe, Delete, Response, Res } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Helper } from 'src/helpers/helper';
import { User } from 'src/users/entities/user.entity';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { InvoicesService } from './invoices.service';
import * as crypto from 'crypto';
import { SettleInvoiceDto } from './dtos/settle-invoice.dto';
import { InvoiceStatus } from 'src/enums/enum';
import { UpdatePendingInvoiceDto } from './dtos/update-pending-invoice.dto';
import { CreatePDFService } from 'src/create-pdf/create-pdf.service';

@UseGuards(AuthGuard, JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private pdfService: CreatePDFService,
    private helper: Helper,
  ) {}

  @Post()
  async create(@CurrentUser() user: User, @Body() body: CreateInvoiceDto) {
    return await this.invoicesService.create(user, body);
  }

  @Get('/:invoiceNumber/preview')
  async getPreview(@Param('invoiceNumber') invoiceNumber: string, @CurrentUser() user: User){
    return await this.invoicesService.getPreview(invoiceNumber, user)
  }

  @Put('/:invoiceNumber/settle')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 1048576 * 10 } }),
  )
  async settleInvoice(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Param('invoiceNumber') invoiceNumber: string,
    @Body() data: SettleInvoiceDto,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Please attach proof of payment')
      }

      const mimeTypes = [
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/pdf',
        'image/jpeg', // .jpg and .jpeg
        'image/png',, //png
      ];
      if (!mimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Only allows upload doc, docx, pdf, jpg, or jpeg extention',
        );
      }

      const fileExt = '.' + file.originalname.split('.').pop();
      const hashedFileName = `${crypto
        .randomBytes(32)
        .toString('hex')}${fileExt}`;
      const upload = {
        file,
        fileExt,
        hashedFileName,
      };

      return await this.invoicesService.settleInvoice(
        invoiceNumber,
        data,
        upload,
        user,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('/:invoiceNumber/files')
  async downloadProof(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('invoiceNumber') invoiceNumber: string,
  ) {
    await this.invoicesService.downloadProof(res, invoiceNumber, user);
  }

  @Get('/download/:invoiceNumber')
  async downloadPDF(
    @Res() response,
    @Param('invoiceNumber') invoiceNumber: string,
    @CurrentUser() user: User
  ){
    let data = await this.invoicesService.getPreview(invoiceNumber, user)
   let result = await this.pdfService.invoicePDF(data)
   let pdf = result.pipe(response)
   return pdf

  }

  @Get('/:invoiceNumber/:invoiceStatus')
  async getInvoiceDetail(
    @CurrentUser() user: User,
    @Param('invoiceNumber') invoiceNumber: string,
    @Param('invoiceStatus') invoiceStatus: InvoiceStatus
  ){
    return await this.invoicesService.getDetail(invoiceNumber, invoiceStatus, user)
  }

  @Get(':invoiceStatus/:page/:perpage')
  async getInvoicePaged(
    @CurrentUser() user: User,
    @Param('invoiceStatus') invoiceStatus: InvoiceStatus,
    @Param('page', ParseIntPipe) page: number,
    @Param('perpage', ParseIntPipe) perpage: number,
    @Query('filter') filter: string,
    @Query('date') date: string,
  ) {
    return await this.invoicesService.getList(
      invoiceStatus,
      page,
      perpage,
      filter,
      date,
      user,
    );
  }
  
  // update pending invoice
  @Put('/:invoiceNumber')
  async updateInvoice(
    @Param('invoiceNumber') invoiceNumber: string,
    @Body() body: UpdatePendingInvoiceDto,
    @CurrentUser() user: User,
  ){
    return await this.invoicesService.updateOrIssueInvoice(invoiceNumber, body, user)    
  }

  // issue pending invoice
  @Put('/:invoiceNumber/issue')
  async issueInvoice(
    @Param('invoiceNumber') invoiceNumber: string,
    @Body() body: UpdatePendingInvoiceDto,
    @CurrentUser() user: User,
  ){
    return await this.invoicesService.updateOrIssueInvoice(invoiceNumber, body, user, true)    
  }
}