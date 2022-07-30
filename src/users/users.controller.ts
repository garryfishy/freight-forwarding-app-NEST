import { 
  Controller, 
  Post, 
  Get, 
  Body,
  UseGuards,
  Patch,
  HttpCode,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { UserRegistDto } from './dtos/user-regist.dto'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserResetPasswordDto } from './dtos/user-reset-password.dto';
import { UserResetPasswordMailDto } from './dtos/user-reset-password-mail.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserVerifyDto } from './dtos/user-verify.dto';
import { UserVerifyMailDto } from './dtos/user-verify-mail.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    ) {}
    
  @Serialize(UserDto)
  @Post()
  regist(@Body() body: UserRegistDto) {
    return this.usersService.create(body);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get()
  getMyProfile(@CurrentUser() user: User) {
    return this.usersService.findById(user.userId, user.companyId);
  }

  @Post('/password')
  @HttpCode(200)
  resetPasswordMail(@Body() body: UserResetPasswordMailDto) {
    return this.usersService.resetPasswordMail(body.email)
  }

  @Post('/password/code')
  @HttpCode(200)
  checkResetPasswordCode(@Body() body: { code: string }) {
    return this.usersService.checkResetPasswordCode(body.code)
  }

  @Patch('/password')
  resetPassword(@CurrentUser() user: User, @Body() body: UserResetPasswordDto) {
    return this.usersService.resetPassword( body)
  }

  @Post('/verification')
  @HttpCode(200)
  verifyAccountMail(@Body() body: UserVerifyMailDto) {
    return this.usersService.sendVerificationMail(body.email)
  }

  @Patch('/verification')
  verifyAccount(@CurrentUser() user: User, @Body() body: UserVerifyDto) {
    return this.usersService.sendVerification(user.userId, body.code)
  }

  @UseGuards(JwtAuthGuard, AuthGuard)
  @Get('/sidebar-menu')
  async getSidebar(
    @CurrentUser() user: User
  ){
    try {
      return await this.usersService.getSidebar(user.userId)
    } catch (error) {
      throw error
    }
  }
}