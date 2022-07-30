import { IsEnum, IsNotEmpty, IsNumber, IsString, Min, ValidationArguments } from 'class-validator'
import { Uom } from 'src/enums/enum';

export class SellingPriceDto {
  @IsString()
  @IsNotEmpty()
  priceComponent: string;

  @IsEnum(Uom, { message: (args: ValidationArguments) => {
    return `${args.property} should not be ${args.value === "" ? "empty" : args.value}`
  }})
  uom: Uom;

  @IsNumber()
  @Min(1)
  price: number;

  @IsNumber()
  @Min(1)
  qty: number;

  @IsNumber()
  @Min(0)
  vat: number;

  @IsNumber()
  @Min(1)
  total: number;
}