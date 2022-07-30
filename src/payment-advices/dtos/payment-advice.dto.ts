import { IsString } from 'class-validator';

export class PaymentAdviceDto {
  @IsString()
  bankName: string;

  @IsString()
  currencyName: string;

  @IsString()
  accNumber: string;

  @IsString()
  accHolder: string;

  @IsString()
  paymentInstructions: string;
}
