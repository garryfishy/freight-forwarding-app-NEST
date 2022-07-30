import { Type } from 'class-transformer';
import { IsEmail, IsString, IsArray, ValidateNested, IsOptional, IsNumber, IsIn, IsBoolean } from 'class-validator';
import { MenuAccessDto } from 'src/access-role/dtos/menu-access.dto';
import { IsOnlyInclude } from 'src/decorators/is-only-include.decorator';
import { Role } from 'src/enums/enum';

export class UpdateOtherUserDto {
  @IsNumber()
  userId: number;
  
  @IsString()
  @IsOptional()
  @IsOnlyInclude(' .abcdefghijklmnopqrstuvwxyz', {
    message: 'fullName only allows alphabet and period',
  })
  fullName: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  jobTitle: string;

  @IsIn([Role.ADMIN, Role.MANAGER, Role.STAFF, Role.USER])
  @IsOptional()
  role: string;

  @IsString()
  phoneCode: string;

  @IsString()
  phoneNumber: string;

  // @IsString()
  // @IsOptional()
  // roleAccess: string;

  @IsBoolean()
  isActive: boolean

  @IsArray()
  @IsOptional()
  @Type(() => MenuAccessDto)
  menuAccess: MenuAccessDto[];
}
