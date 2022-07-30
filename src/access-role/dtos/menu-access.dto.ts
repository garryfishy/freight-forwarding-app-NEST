import { IsBoolean, IsNumber } from 'class-validator';

export class MenuAccessDto {
  @IsNumber()
  id: number

  @IsBoolean()
  permission: boolean;


}
