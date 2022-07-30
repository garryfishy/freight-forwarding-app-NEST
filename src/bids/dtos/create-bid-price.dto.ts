import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidationArguments } from 'class-validator';
import { Uom } from 'src/enums/enum';

export class CreateBidPriceDto {
  @IsNumber()
  priceCompId: number;

  @IsString()
  @IsNotEmpty()
  priceCompCode: string;

  @IsString()
  @IsNotEmpty()
  priceCompName: string;

  @IsEnum(Uom, { message: (args: ValidationArguments) => {
    return `${args.property} should not be ${args.value === "" ? "empty" : args.value}`
  }})
  uom: Uom;

  @IsNumber()
  @Min(1)
  price: number;

  @IsNumber()
  profit: number;

  @IsNumber()
  @Min(1)
  total: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note: string;
}
