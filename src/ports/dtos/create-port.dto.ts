import { IsString } from 'class-validator';

export class CreatePortDto {
  @IsString()
  portName: string;
}
