import {
  Body,
  Controller,
  HttpCode,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/user-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @Post('/login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Delete('/logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: User) {
    return this.authService.logout(user);
  }
}
