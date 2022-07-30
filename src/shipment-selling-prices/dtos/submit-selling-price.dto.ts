import { Type } from "class-transformer";
import { IsArray, ArrayNotEmpty, ArrayMinSize, ValidateNested } from "class-validator";
import { SellingPriceDto } from "../../shipment-selling-prices/dtos/selling-price.dto";
export class SubmitSellingPriceDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SellingPriceDto)
  sellingPrices: SellingPriceDto[];

}