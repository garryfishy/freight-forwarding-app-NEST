import { Type } from "class-transformer";
import { IsNumber, IsString, IsArray, ArrayNotEmpty, ArrayMinSize, ValidateNested, IsNotEmpty, Min} from "class-validator";
import {SellingPriceDto} from "../../shipment-selling-prices/dtos/selling-price.dto";
export class UpdatePendingInvoiceDto {
  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @Min(1)
  subTotal: number

  @IsNumber()
  @Min(0)
  materai: number

  @IsNumber()
  @IsNotEmpty()
  advance: number

  @IsNumber()
  @Min(1)
  total: number

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SellingPriceDto)
  sellingPrices: SellingPriceDto[];

}