import { IsString } from 'class-validator';

export class SettleInvoiceDto {
  @IsString()
  paymentDate: string;

  @IsString()
  bank: string;

  @IsString()
  bankHolder: string;

  @IsString()
  settledAmount: string;

}