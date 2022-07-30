import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsBoolean, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'
import { 
  CustomerPosition, 
  ProductType, 
  RouteType, 
  ShipmentService, 
  ShipmentType, 
  ShipmentVia 
} from 'src/enums/enum';
import { PackingListDto } from './packing-list.dto';

export class CreateQuotationDto {
  @IsString()
  customerId: string;

  // shipping section
  @IsString()
  shipmentVia: ShipmentVia;

  @IsString()
  shipmentService: ShipmentService;

  @IsString()
  countryFrom: string;

  @IsString()
  cityFrom: string;

  @IsString()
  @MaxLength(500)
  addressFrom: string;

  @IsString()
  @MaxLength(10)
  zipcodeFrom: string;

  @IsString()
  countryTo: string;

  @IsString()
  cityTo: string;

  @IsString()
  @MaxLength(500)
  addressTo: string;

  @IsString()
  @MaxLength(10)
  zipcodeTo: string;

  @IsString()
  customerPosition: CustomerPosition;

  @IsString()
  routeType: RouteType;

  @IsString()
  shipmentDate: string;

  // shipment type section
  @IsString()
  shipmentType: ShipmentType;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackingListDto)
  packingList: PackingListDto[];

  @IsString()
  containerType: string;

  @IsString()
  containerOption: string;

  @IsNumber()
  temperature: number;

  // product type section
  @IsString()
  productType: ProductType;

  @IsString()
  kindOfGoods: string;

  @IsNumber()
  valueOfGoods: number;

  @IsString()
  hsCode: string;

  @IsOptional()
  @IsString()
  poNumber: string;

  @IsString()
  unNumber: string;

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