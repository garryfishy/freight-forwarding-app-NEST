import { Type } from "class-transformer";
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsString, ValidateNested } from "class-validator";
import { SellingPriceDto } from "src/shipment-selling-prices/dtos/selling-price.dto";

export class CreateInvoiceDto {
  @IsString()
  rfqNumber: string;
  
  @IsString()
  orderNumber: string;

  @IsString()
  customerId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SellingPriceDto)
  sellingPrices: SellingPriceDto[];
}