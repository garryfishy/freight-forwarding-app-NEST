import { IsAlpha, IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { IsNotInclude } from 'src/decorators/is-not-include.decorator';
import { IsOnlyInclude } from 'src/decorators/is-only-include.decorator';

export class CreateCustomerDto {
  @IsString()
  @IsNotInclude('~!@#$%^&*()_+`,=[]{};:<>/?\|"0123456789', {
    message: 'full name contains invalid characters'
  })
  fullName: string;

  @IsString()
  companyName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOnlyInclude('0123456789', {
    message: 'phone code only allows numbers',
  })
  phoneCode: string;

  @IsString()
  @IsOnlyInclude('0123456789', {
    message: 'phone number only allows numbers',
  })
  phoneNumber: string;

  @IsString()
  customerType: string;

  @IsString()
  @Length(20,20)
  @IsOnlyInclude('.-1234567890', {
    message: 'npwp only allows numbers, period, and dash',
  })
  npwp: string;

  @IsString()
  @MaxLength(500)
  address: string;
}
