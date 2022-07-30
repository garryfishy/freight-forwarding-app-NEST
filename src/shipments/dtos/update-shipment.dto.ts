import { IsString, IsOptional, IsEmail, MaxLength }  from  'class-validator'

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  shippingLine: string;

  @IsOptional()
  @IsString()
  vendor: string;

  @IsOptional()
  @IsString()
  masterBl: string;

  @IsOptional()
  @IsString()
  masterBlType: string;

  @IsOptional()
  @IsString()
  houseBl: string;

  @IsOptional()
  @IsString()
  houseBlType: string;

  @IsOptional()
  @IsString()
  terms: string;

  // shipper
  @IsOptional()
  @IsString()
  shipperName: string;

  @IsOptional()
  @IsString()
  shipperCompany: string;

  @IsOptional()
  @IsString()
  shipperPhoneCode: string;

  @IsOptional()
  @IsString()
  shipperPhone: string;

  @IsOptional()
  @IsString()
  shipperTaxId: string;

  @IsOptional()
  @IsEmail()
  shipperEmail: string;

  @IsOptional()
  @IsString()
  shipperZipCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shipperAddress: string;

  // consignee
  @IsOptional()
  @IsString()
  consigneeName: string;

  @IsOptional()
  @IsString()
  consigneeCompany: string;

  @IsOptional()
  @IsString()
  consigneePhoneCode: string;
  
  @IsOptional()
  @IsString()
  consigneePhone: string;

  @IsOptional()
  @IsString()
  consigneeTaxId: string;

  @IsOptional()
  @IsEmail()
  consigneeEmail: string;

  @IsOptional()
  @IsString()
  consigneeZipCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  consigneeAddress: string;
}