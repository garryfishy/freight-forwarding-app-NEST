import { IsString, IsNumber, MaxLength, Max, Min } from 'class-validator'
import { OtifStatus, RevenueKind, ShipmentService } from 'src/enums/enum';

export class SubmitRevenueDto {
  @IsString()
  customerId: string;

  @IsString()
  orderNumber: string;

  @IsString()
  otifStatus: OtifStatus;
  
  // progression or adjustment
  @IsString()
  kind: RevenueKind; 

  @IsString()
  @MaxLength(4)
  year: string;

  @IsString()
  @MaxLength(2)
  month: string;

  @IsNumber()
  initialAmount: number;

  @IsNumber()
  finalAmount: number;

  // finalAmount - initialAmount (if kind === adjustment)
  @IsNumber()
  adjustmentAmount: number;

  // percentage number of the current progression (if kind === progression)
  @IsNumber()
  @Min(0)
  @Max(100)
  progressionPercentage: number;
  
  // cummulative progression percentage
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number

  // finalAmount * progressionPercentage (finalAmount === initialAmount)
  @IsNumber()
  progressionAmount: number;

  // cumulative remaining amount (not revenue yet)
  @IsNumber()
  remaining: number;

  // cumulative revenue
  @IsNumber()
  settled: number;
  
  @IsString()
  shipmentService: ShipmentService;
  
  @IsString()
  rfqNumber: string;

  @IsString()
  affiliation: string;

}
