import { Controller, Post, Get, Param, ParseIntPipe, Query, UseGuards, Body, UseInterceptors, UploadedFile, Put, Delete, BadRequestException } from '@nestjs/common'
import { AuthGuard } from 'src/auth/auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ShipmentStatus, ShipmentVia } from 'src/enums/enum';
import { Helper } from 'src/helpers/helper';
import { User } from 'src/users/entities/user.entity';
import { ShipmentsService } from './shipments.service';
import * as crypto from 'crypto'
import { FileInterceptor } from '@nestjs/platform-express';
import { ShipmentFilesService } from 'src/shipment-files/shipment-files.service';
import { ShipmentOtifsService } from 'src/shipment-otifs/shipment-otifs.service';
import { SubmitShipmentOtifDto } from 'src/shipment-otifs/dtos/submit-shipment-otif.dto';
import { CreateShipmentDto } from './dtos/create-shipment.dto';
import { UpdateShipmentDto } from './dtos/update-shipment.dto';
import { SubmitSellingPriceDto } from 'src/shipment-selling-prices/dtos/submit-selling-price.dto';
import { ShipmentSellingPricesService } from 'src/shipment-selling-prices/shipment-selling-prices.service';

@Controller('shipments')
@UseGuards(AuthGuard, JwtAuthGuard)
export class ShipmentsController {
  constructor(
    private shipmentsService: ShipmentsService,
    private shipmentFilesService: ShipmentFilesService,
    private shipmentOtifsService: ShipmentOtifsService,
    private shipmentSellingPricesService: ShipmentSellingPricesService,
    private helper: Helper
  ) {}
  
  @Post('/:orderNumber/selling-prices')
  async createSellingPrices(
    @CurrentUser() user: User, 
    @Param('orderNumber') orderNumberParam: string,
    @Body() body: SubmitSellingPriceDto
  ) {
    const orderNumber = this.helper.transformRfqOrOrderNumber(orderNumberParam)
    return await this.shipmentSellingPricesService.submit(user, orderNumber, body)
  }

  @Get('/:orderNumber/selling-prices')
  async getSellingPrices(@Param('orderNumber') orderNumberParam: string) {
    const orderNumber = this.helper.transformRfqOrOrderNumber(orderNumberParam)
    return await this.shipmentSellingPricesService.getAll(orderNumber)
  }

  @Post('/:rfqNumber')
  async create(
    @CurrentUser() user: User,
    @Param('rfqNumber') rfqNumberParam: string,
    @Body() body: CreateShipmentDto,
  ) {
    try {
      const rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumberParam)
      return await this.shipmentsService.create(user, rfqNumber, body)
    } catch (error) {
      throw error      
    }
  }
  
  @Put('/:orderNumber')
  async update(
    @CurrentUser() user: User,
    @Param('orderNumber') orderNumberParam: string,
    @Body() body: UpdateShipmentDto,
  ) {
    try {
      const orderNumber = this.helper.transformRfqOrOrderNumber(orderNumberParam)
      return await this.shipmentsService.update(user, orderNumber, body)
    } catch (error) {
      throw error      
    }
  }

  @Get('/:page/:perpage')
  async getPaged(
    @CurrentUser() user: User,
    @Param('page', ParseIntPipe) page: number,
    @Param('perpage', ParseIntPipe) perpage: number,
    @Query('status') shipmentStatus: ShipmentStatus,
    @Query('via') shipmentVia: ShipmentVia,
    @Query('search') filter: string,
    @Query('createdAt') createdAt: string, 
  ) {
    return await this.shipmentsService.getPaged(
      user, 
      page, 
      perpage, 
      shipmentStatus, 
      shipmentVia,
      filter, 
      createdAt
    )
  }

  @Get('/:orderNumber')
  async getDetail(@CurrentUser() user: User, @Param('orderNumber') orderNumberParam: string) {
    const orderNumber = this.helper.transformRfqOrOrderNumber(orderNumberParam);
    return await this.shipmentsService.getDetail(user, orderNumber)
  }

  @Post('/:orderNumber/otifs')
  async createOtif(
    @CurrentUser() user: User,
    @Param('orderNumber') orderNumberParam: string,
    @Body() body: SubmitShipmentOtifDto
  ) {
    const orderNumber = this.helper.transformRfqOrOrderNumber(orderNumberParam);
    return await this.shipmentOtifsService.create(user, orderNumber, body)
  }

  @Put('/:orderNumber/otifs')
  async updateOtif(
    @CurrentUser() user: User,
    @Param('orderNumber') orderNumberParam: string,
    @Body() body: SubmitShipmentOtifDto
  ) {
    const orderNumber = this.helper.transformRfqOrOrderNumber(orderNumberParam);
    return await this.shipmentOtifsService.update(user.userId, user.fullName, orderNumber, body)
  }
  
  @Post('/:orderNumber/files')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 1048576 * 10 } }),
  )
  async uploadFile(
    @CurrentUser() user: User, 
    @UploadedFile() file: Express.Multer.File,
    @Param('orderNumber') orderNumberParam: string,
  ) {
    try {
      const orderNumber = this.helper.transformRfqOrOrderNumber(orderNumberParam);
      const shipment = await this.shipmentsService.getOneCheck({ orderNumber })
      if (!shipment) {
        throw new BadRequestException('Shipment not found')
      }

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
      const upload = {
        file,
        fileExt,
        hashedFileName
      };
      
      return await this.shipmentFilesService.create(user.userId, orderNumber, upload);
    } catch(error) {
      throw error;
    }
  }

  @Delete('/:orderNumber/files/:fileId')
  async deleteFiles(
    @Param('orderNumber') orderNumberParam: string,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    try {
      const orderNumber = this.helper.transformRfqOrOrderNumber(orderNumberParam);
      return await this.shipmentFilesService.delete(orderNumber, fileId);
    } catch(error) {
      throw error;
    }
  }
  
}