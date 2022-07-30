import { IsString, IsNumber, IsOptional } from 'class-validator'
import { OtifStatus, ShipmentService } from 'src/enums/enum';

export class SubmitShipmentOtifDto {
  @IsString()
  otifStatus: OtifStatus;

  @IsOptional()
  @IsString()
  documentDate: string;

  @IsOptional()
  @IsString()
  etd: string;

  @IsOptional()
  @IsString()
  etdTime: string;

  @IsOptional()
  @IsString()
  eta: string;

  @IsOptional()
  @IsString()
  etaTime: string;

  @IsOptional()
  @IsString()
  pickupDate: string;

  @IsOptional()
  @IsString()
  pickupTime: string;

  @IsOptional()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  driverName: string;

  @IsOptional()
  @IsString()
  driverPhone: string;

  @IsOptional()
  @IsString()
  vehiclePlateNumber: string;

  @IsOptional()
  @IsNumber()
  grossWeight: number;

  @IsOptional()
  @IsNumber()
  nettWeight: number;

  @IsOptional()
  @IsString()
  activity: string;

  @IsOptional()
  @IsString()
  noPeb: string;

  @IsOptional()
  @IsString()
  portOfLoading: string;

  @IsOptional()
  @IsString()
  voyageName: string;

  @IsOptional()
  @IsNumber()
  voyageNumber: number;

  @IsOptional()
  @IsString()
  containerNumber: string;

  @IsOptional()
  @IsString()
  portOfDischarge: string;

  @IsOptional()
  @IsString()
  reasonFailed: string;
}