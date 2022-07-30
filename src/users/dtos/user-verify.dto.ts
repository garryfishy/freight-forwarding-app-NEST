import { IsNumber, IsString } from 'class-validator';

export class UserVerifyDto {
  @IsString()
  code: string;
}