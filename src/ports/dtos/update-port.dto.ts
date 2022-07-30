import { IsString } from 'class-validator';

export class UpdatePortDto {
  @IsString()
  portName: string;
}
