import { IsNumber, IsString } from "class-validator";
import { PackagingType } from "src/enums/enum";

export class PackingListDto {
  @IsNumber()
  packageQty: number;

  @IsString()
  packagingType: PackagingType;

  @IsNumber()
  weight: number;

  @IsNumber()
  length: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}