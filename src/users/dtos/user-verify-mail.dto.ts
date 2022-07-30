import { IsNumber, IsEmail } from 'class-validator';

export class UserVerifyMailDto {
  @IsEmail()
  email: string;
}