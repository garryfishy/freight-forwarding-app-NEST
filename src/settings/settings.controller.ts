import { 
  Body, 
  Controller, 
  UseInterceptors,
  UploadedFile,
  Param, 
  Post,
  ParseIntPipe,
  Query,
  Patch, 
  Delete,
  UseGuards, 
  Put,
  Get,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Serialize } from '../interceptors/serialize.interceptor'

import { AuthGuard } from 'src/auth/auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';

import * as crypto from 'crypto'

import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { CompaniesService } from 'src/companies/companies.service';
import { PaymentAdvicesService} from 'src/payment-advices/payment-advices.service';
import { UpdateUserPasswordDto } from './dtos/update-user-password.dto';
import { UserDto } from 'src/users/dtos/user.dto';
import { PaymentAdviceDto } from 'src/payment-advices/dtos/payment-advice.dto';
import { CreateQuotationNotesDto } from './dtos/create-quotation-notes.dto';
import { S3Service} from 'src/upload-s3/upload-s3.service'
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { UpdateOtherUserDto } from 'src/users/dtos/update-other-user-dto';
import { Roles } from 'src/decorators/roles.decorator';
import { Action, RoleAccess } from 'src/enums/enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { ForbiddenError } from '@casl/ability';
import { CheckAbilities } from 'src/decorators/casl.decorator';
import { AbilitiesGuard } from 'src/auth/abilities.guard';
@Controller('settings')
@UseGuards(AuthGuard, JwtAuthGuard)
export class SettingsController {
  constructor(
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private paymentAdvicesService: PaymentAdvicesService,
    private s3Service: S3Service,
    private caslAbilityFactory: CaslAbilityFactory
  ) {}

  // user profile

  @Get('/users')
  getUserProfile(@CurrentUser() user: User) {
    return this.usersService.getUserProfile(user.userId);
  }

  @Patch('/users/photos')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 1048576 * 5 } }), // Max photo size 5MB
  )
  @Serialize(UserDto)
  async updateUserPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    try {
      const filenameSplit = file.originalname.split('.');
      const fileExt = filenameSplit[filenameSplit.length - 1];
      const fileName = `${crypto.randomBytes(32).toString('hex')}.${fileExt}`;


      const data = {
        file,
        fileName,
        fileExt,
        fileSize: file.size,
        mimeType: file.mimetype,
        // code: DOCUMENT_TYPE[body.documentType],
        userId: user.userId,
      };
      let upload = await this.s3Service.uploadPhoto(data);
      if (upload) {
        return await this.usersService.updatePhoto(user.userId, upload);
      }
    } catch (error) {
      throw error;
    }
  }

  @Patch('/users/passwords')
  async updatePassword(
    @CurrentUser() user: User,
    @Body() body: UpdateUserPasswordDto,
  ) {
    try {
      return await this.usersService.updatePassword(user.userId, body.password);
    } catch (error) {
      throw error;
    }
  }

  // change user' name, email, phone, role
  @Patch('/users/:type')
  async updateUser(
    @CurrentUser() user: User,
    @Param('type') type: string, // TODO: create enum
    @Body() body: UpdateUserDto,
  ) {
    try {
      return await this.usersService.update(user, type, body);
    } catch (error) {
      throw error;
    }
  }

  // company profile

  @Get('/companies')
  getCompanyProfile(@CurrentUser() user: User) {
    return this.companiesService.getCompanyProfile(user.companyId);
  }

  @Patch('/companies/photos')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 1048576 * 5 } }), // Max photo size 5MB
  )
  async updateCompanyPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    try {
      const filenameSplit = file.originalname.split('.');
      const fileExt = filenameSplit[filenameSplit.length - 1];
      const fileName = `${crypto.randomBytes(32).toString('hex')}.${fileExt}`;

      const data = {
        file,
        fileName,
        fileExt,
        fileSize: file.size,
        mimeType: file.mimetype,
        // code: DOCUMENT_TYPE[body.documentType],
        companyId: user.companyId,
      };
      let upload = await this.s3Service.uploadPhoto(data);
      if (upload) {
        return await this.companiesService.updatePhoto(user.userId, user.companyId, upload);
      }
      return;
    } catch (error) {
      throw error;
    }
  }

  // update company' name, address, email, phone, npwp
  @Patch('/companies')
  async updateCompany(
    @CurrentUser() user: User,
    @Body() body: UpdateCompanyDto,
  ) {
    try {
      return await this.companiesService.update(user.userId, user.companyId, body);
    } catch (error) {
      throw error;
    }
  }
  
  @Put('/companies/payment-advices/:paymentAdviceId')
  async updateAdvice(
    @CurrentUser() user: User,
    @Param('paymentAdviceId', ParseIntPipe) id: number,
    @Body() body: PaymentAdviceDto,
  ) {
    try {
      return await this.paymentAdvicesService.submit(user, body, id);
    } catch (error) {
      throw error;
    }
  }

  @Post('/companies/payment-advices')
  async postAdvice(@CurrentUser() user: User, @Body() body: PaymentAdviceDto) {
    try {
      return await this.paymentAdvicesService.submit(user, body);
    } catch (error) {
      throw error;
    }
  }

  @Delete('/companies/payment-advices/:paymentAdviceId')
  async deleteAdvice(
    @CurrentUser() user: User,
    @Param('paymentAdviceId', ParseIntPipe) id: number
  ) {
    try {
      return await this.paymentAdvicesService.delete(user, id);
    } catch (error) {
      throw error;
    }
  }

  @Patch('/companies/:id/quotation-notes')
  async postNewQuotationNotes(
    @CurrentUser() user: User,
    @Body() body: CreateQuotationNotesDto,
    @Param('id') id: number,
  ) {
    try {
      return await this.companiesService.createQuotationNote(
        user.userId,
        id,
        body.quotationNotes,
      );
    } catch (error) {
      throw error;
    }
  }

  @Patch('/companies/theme-color')
  async changeColor(
    @Body() body: { color: string },
    @CurrentUser() user: User,
  ) {
    try {
      return this.companiesService.changeColor(body.color, user.companyId, user.userId);
    } catch (error) {
      throw error;
    }
  }

  @Get('/users/all/:page/:perpage')
  async getUsers(
    @Param('page', ParseIntPipe) page: number,
    @Param('perpage', ParseIntPipe) perpage: number,
    @Query('filter') filter: string,
    @Query('sort') sort: string,
    @Query('createdAt') createdAt: string,
    @CurrentUser() user: User
  ){
    try {
      return await this.usersService.getAllUsers(user.affiliation,page,perpage,filter,sort,createdAt,user)
    } catch (error) {
      throw error      
    }
  }

  @Get('/users/:userId')
  async getUserDetail(
    @Param('userId') userId: number
  ){
    try {
      return await this.usersService.getUserDetail(userId)
    } catch (error) {
      throw error
    }
  }

  @Get('/manage-user/menus')
  async getMenus(
    @CurrentUser() user: User
  )
  {
    try {
      return await this.usersService.getMenu(user)
    } catch (error) {
      throw error
    }
  }


  @Post('/users')
  async createUser(
    @Body() body: CreateUserDto,
    @CurrentUser() currentUser: User,
  ) {
      return this.usersService.createUserFromSettings(body, currentUser);
  }

  @Put('/users/edit')
  async updateOtherUser(
    @Body() body: UpdateOtherUserDto,
    @CurrentUser() currentUser: User,
  ) {
      return this.usersService.updateOtherUser(body, currentUser);
  }

  @Delete('/users/:userId')
  async deleteUser(
    @CurrentUser() user:User,
    @Param('userId') userId:number
  ){
    try {

      if(+userId === user.userId){
        return new BadRequestException('You cannot delete your own account')
      }else{
        await this.usersService.deleteUser(userId,user.affiliation)
      }
    } catch (error) {
      throw error
    }
  }
}
