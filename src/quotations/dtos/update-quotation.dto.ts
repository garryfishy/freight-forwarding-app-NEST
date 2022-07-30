import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import {
  CustomerPosition,
  ProductType,
  RouteType,
  ShipmentService,
  ShipmentType,
  ShipmentVia,
} from 'src/enums/enum';
import { PackingListDto } from './packing-list.dto';
// TODO

export class UpdateQuotationDto {
  @IsOptional()
  @IsString()
  customerId: string;

  // shipping section
  @IsOptional()
  @IsString()
  shipmentVia: ShipmentVia;

  @IsOptional()
  @IsString()
  shipmentService: ShipmentService;

  @IsOptional()
  @IsString()
  countryFrom: string;

  @IsOptional()
  @IsString()
  cityFrom: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressFrom: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipcodeFrom: string;

  @IsOptional()
  @IsString()
  countryTo: string;

  @IsOptional()
  @IsString()
  cityTo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressTo: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipcodeTo: string;

  @IsOptional()
  @IsString()
  customerPosition: CustomerPosition;

  @IsOptional()
  @IsString()
  routeType: RouteType;

  @IsOptional()
  @IsString()
  shipmentDate: string;

  // shipment type section
  @IsOptional()
  @IsString()
  shipmentType: ShipmentType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackingListDto)
  packingList: PackingListDto[];

  @IsOptional()
  @IsString()
  containerType: string;

  @IsOptional()
  @IsString()
  containerOption: string;

  @IsOptional()
  @IsNumber()
  temperature: number;

  // product type section
  @IsOptional()
  @IsString()
  productType: ProductType;

  @IsOptional()
  @IsString()
  kindOfGoods: string;

  @IsOptional()
  @IsNumber()
  valueOfGoods: number;

  @IsOptional()
  @IsString()
  hsCode: string;

  @IsOptional()
  @IsString()
  poNumber: string;

  @IsOptional()
  @IsString()
  unNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description: string;

  // additional section
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark: string;

  @IsOptional()
  @IsBoolean()
  originCustomsClearance: boolean;

  @IsOptional()
  @IsBoolean()
  destinationCustomsClearance: boolean;

  @IsOptional()
  @IsBoolean()
  estimateStorage: boolean;

}
