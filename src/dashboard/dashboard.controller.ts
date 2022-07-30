import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { DashboardService } from './dashboard.service';

@UseGuards(AuthGuard, JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  async getSummary(@CurrentUser() currentUser: User) {
    return await this.dashboardService.getSummary(currentUser);
  }

  @Get('/revenues/:year')
  async getRevenue(@CurrentUser() currentUser: User, @Param('year', ParseIntPipe) year: number) {
    return await this.dashboardService.getRevenue(currentUser, year)
  }

  @Get('/shipments/:year')
  async getShipment(@CurrentUser() currentUser: User, @Param('year', ParseIntPipe) year: number) {
    return await this.dashboardService.getShipment(currentUser, year)
  }
}
