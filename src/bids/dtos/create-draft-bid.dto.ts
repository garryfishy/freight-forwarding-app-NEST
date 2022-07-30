import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreateBidPriceDto } from './create-bid-price.dto';

export class CreateDraftBidDto {
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
  @ValidateNested({each: true})
  @Type(() => CreateBidPriceDto)
  bidPrices: CreateBidPriceDto[]
}
