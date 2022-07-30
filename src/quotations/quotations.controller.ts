import { 
  Body,
  Controller,
  Get,
  Response,
  Injectable,
  Res,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Patch,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { QuotationFilesService } from 'src/quotation-files/quotation-files.service';
import { User } from 'src/users/entities/user.entity';
import { CreateQuotationDto } from './dtos/create-quotation.dto';
import { UpdateQuotationDto } from './dtos/update-quotation.dto';
import { QuotationsService } from './quotations.service';
import * as crypto from 'crypto'
import { Helper } from 'src/helpers/helper';
import { CreatePDFService } from "src/create-pdf/create-pdf.service";
import { S3Service } from 'src/upload-s3/upload-s3.service';
import { MailService } from 'src/mail/mail.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import {WhatsappDto} from '../whatsapp/dtos/whatsapp.dto';
@Injectable()
@UseGuards(AuthGuard, JwtAuthGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(
    private quotationFilesService: QuotationFilesService,
    private quotationsService: QuotationsService,
    private createPDFService: CreatePDFService,
    private s3Service: S3Service,
    private mailService: MailService,
    private whatsappService: WhatsappService,
    private helper: Helper,
  ) {}

  @Get('/download/:rfqNumber')
  async download(
    @Res() response,
    @Param('rfqNumber') rfqNumber: string,
    @CurrentUser() user: User
  )
  {
    try {
      rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumber);
      let company = await this.quotationsService.getManageRequestDetail(rfqNumber, user.affiliation, user.companyId)
      let result = await this.createPDFService.quotationPDF(company)
      let pdf = result.pipe(response)
      return pdf
    } catch (error) {
      throw error
    }
  }

  @Post('/sendMailQuotations/:rfqNumber')
  async sendQuotations(
    @Param('rfqNumber') rfqNumber: string,
    @CurrentUser() user:User,
    @Body() body
  ){
    try {
      const {email} = body
      rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumber);
      let url = await this.quotationsService.getS3Url(rfqNumber, user)
      body['company'] = url.company
      body['email'] = email
      body.company.addressFrom = body.company.addressFrom.length > 1 ? body.company.addressFrom : '-'
      body.company.zipcodeFrom = body.company.zipcodeFrom.length > 1 ? body.company.zipcodeFrom : '-'
      body.company.addressTo = body.company.addressTo.length > 1 ? body.company.addressTo : '-'
      body.company.zipcodeTo = body.company.zipcodeTo.length > 1 ? body.company.zipcodeTo : '-'

      let sendmail = await this.mailService.shareQuotationEmail(body)
      if(sendmail){
        return {
          message: 'Email has been sent'
        }
      }
    } catch (error) {
      throw error 
    }
  }

  @Post()
  async create(@CurrentUser() user: User, @Body() body: CreateQuotationDto) {
    return await this.quotationsService.create(user.userId, user.companyId, body);
  }

  @Get('/getUrl/:rfqNumber')
  async getS3Url(
    @Param('rfqNumber') rfqNumber: string,
    @CurrentUser() user: User
  ) {
    rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumber);
    return await this.quotationsService.getS3Url(rfqNumber, user)
  }

  @Put('/:rfqNumber')
  async update(
    @CurrentUser() user: User, 
    @Param('rfqNumber') rfqNumberParam: string,
    @Body() body: UpdateQuotationDto
  ) {
    const rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumberParam);
    return await this.quotationsService.update(user.userId, user.companyId, rfqNumber, body);
  }

  @Get('/:rfqNumber')
  async getDetail(@CurrentUser() user: User, @Param('rfqNumber') rfqNumberParam: string) {
    const rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumberParam);
    const result = await this.quotationsService.getDetail(user.affiliation, user.companyId, rfqNumber)
    if (!result) {
      throw new NotFoundException('Quotation not found')
    }
    return result
  }

  @Get('/request-list/:page/:perpage')
  async getPaged(
    @Param('page', ParseIntPipe) page: number,
    @Param('perpage', ParseIntPipe) perpage: number,
    @Query('filter') filter: string,
    @Query('sort') sort: string,
    @Query('createdAt') createdAt: string,
    @CurrentUser() user: User,
  ) {
    return await this.quotationsService.getPaged(
      page,
      perpage,
      filter,
      sort,
      createdAt,
      user
    );
  }

  @Get('/manage-request/:status/:page/:perpage')
  async getPagedManageRequest(
    @Param('page', ParseIntPipe) page: number,
    @Param('perpage', ParseIntPipe) perpage: number,
    @Param('status') status: string,
    @Query('filter') filter: string,
    @Query('sort') sort: string,
    @Query('createdAt') createdAt: string,
    @CurrentUser() user: User,
  ) {
    return await this.quotationsService.getPagedManageRequest(
      page,
      perpage,
      filter,
      sort,
      createdAt,
      user,
      status
    );
  }

  @Get('/download-attachment/:fileName')
  async downloadAttachment(
    @Res() res: Response,
    @Param('fileName') fileName: string
  ){
    try {
      await this.s3Service.downloadFile(fileName, res)
    } catch (error) {
      throw error
    }
  }

  @Get('/manage-request/:rfqNumber')
  async getManageRequestDetail(
    @Param('rfqNumber') rfqNumberParam: string,
    @CurrentUser() user: User
  ){
    try {
      const rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumberParam);
      return await this.quotationsService.getManageRequestDetail(rfqNumber, user.affiliation, user.companyId)
    } catch (error) {
      throw error      
    }
  }

  @Put('/:rfqNumber/files')
  @UseInterceptors(FilesInterceptor('files', Infinity, { limits: { fileSize: 1048576 * 10 } }))
  async updateFiles(
    @CurrentUser() user: User, 
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('rfqNumber') rfqNumberParam: string,
    @Body() body: { deletedFiles?: string }
  ) {
    try {
      const rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumberParam);
      const quotation = await this.quotationsService.getOneCheck({ rfqNumber })
      if (!quotation) {
        throw new BadRequestException('Quotation not found')
      }

      const uploads = []
      for (let file of files) {
        const mimeTypes = [
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/pdf', 
          'image/jpeg' // .jpg and .jpeg
        ]
        if (!mimeTypes.includes(file.mimetype)) {
          throw new BadRequestException('Only allows upload doc, docx, pdf, jpg, or jpeg extention')
        }
        
        const fileExt = '.' + file.originalname.split('.').pop()
        const hashedFileName = `${crypto.randomBytes(32).toString('hex')}${fileExt}`;
  
        const data = {
          file,
          fileExt,
          hashedFileName
        };
        uploads.push(data)
      }
      
      return await this.quotationFilesService.update(
        user.userId, 
        rfqNumber, 
        body.deletedFiles, 
        uploads
      );
    } catch(error) {
      throw error;
    }
  }

  @Patch('/:rfqNumber/approval/:action')
  async approveOrRejectQuotation(
    @CurrentUser() user: User,
    @Param('rfqNumber') rfqNumberParam: string ,
    @Param('action') action: string ,
  ) {
    if (action !== 'approve' && action !== 'reject') {
      throw new BadRequestException('Only allow "approve" or "reject" quotation')
    }
    const rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumberParam);
    return await this.quotationsService.approveOrReject(user.userId, user.companyId, rfqNumber, action)
  }

  @Post('/shareWhatsapp/:rfqNumber')
  async sendWhatsapp(
    @Param('rfqNumber') rfqNumber: string,
    @CurrentUser() user: User,
    @Body() body: WhatsappDto,
    @Res() response: Response
  ) {
    rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumber);
    const fileName = await this.quotationsService.getS3Url(rfqNumber, user)
    return await this.whatsappService.sendMessage(body.phone, fileName.url, response)
  }
}
