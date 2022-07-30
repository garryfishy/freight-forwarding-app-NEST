import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreateBidPriceDto } from './create-bid-price.dto';

export class CreateBidDto {
  @IsNumber()
  rfqId: number;

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
  @Type(() => CreateBidPriceDto)
  bidPrices: CreateBidPriceDto[]
  
  @IsOptional()
  @IsNumber()
  assignedTo: number;
}
