import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { UpdateBidPriceDto } from './update-bid-price.dto';

export class UpdateBidDto {
  @IsString()
  shippingLine: string;

  @IsString()
  vendorName: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({each: true})
  @Type(() => UpdateBidPriceDto)
  bidPrices: UpdateBidPriceDto[]
}
