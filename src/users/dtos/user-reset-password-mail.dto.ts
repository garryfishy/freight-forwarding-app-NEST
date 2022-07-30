import { IsEmail } from 'class-validator';

export class UserResetPasswordMailDto {
  @IsEmail()
  email: string;
}