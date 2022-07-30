import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { AccessRoleService } from './access-role.service';

@UseGuards(JwtAuthGuard)
@Controller('access-role')
export class AccessRoleController {
  constructor(private accessRoleService: AccessRoleService){}

  @Get('company-menu-access')
  async getCompanyMenuAccess(@CurrentUser() currentUser: User){
    return this.accessRoleService.getCompanyMenuAccess(currentUser);
  }
}
