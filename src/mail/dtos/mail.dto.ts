import { IsString, IsEmail, IsNumber, isNumber, IsOptional } from 'class-validator';

export class MailDto {
    @IsEmail()
    email:string

    @IsString()
    name: string

    @IsString()
    code: string

    @IsString()
    @IsOptional()
    url: string

    @IsString()
    @IsOptional()
    endpoint: string




}
