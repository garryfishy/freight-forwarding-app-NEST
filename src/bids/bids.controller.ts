import { Body, Controller, Post, UseGuards, Get, Param, Put} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Helper } from 'src/helpers/helper';
import { User } from 'src/users/entities/user.entity';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dtos/create-bid.dto';
import { CreateDraftBidDto } from './dtos/create-draft-bid.dto';
import { UpdateBidDto } from './dtos/update-bid.dto';

@UseGuards(AuthGuard, JwtAuthGuard)
@Controller('bids')
export class BidsController {
  constructor(
    private bidsService: BidsService,
    private helper: Helper
  ) {
  }

  @Post('/create')
  async create(@CurrentUser() user: User, @Body() body: CreateBidDto){
    return await this.bidsService.create(user, body)
  }

  @Get('/:rfqNumber')
  async getDetail(@CurrentUser() user: User, @Param('rfqNumber') rfqNumberParam: string){
    const rfqNumber = this.helper.transformRfqOrOrderNumber(rfqNumberParam)
    return await this.bidsService.getDetail(rfqNumber, user)
  }

  @Put('/:bidId')
  async editBid(
    @CurrentUser() user: User,
    @Param('bidId') bidId: number,
    @Body() body: UpdateBidDto
  ){
    return await this.bidsService.update(bidId, body, user.userId)
  }

  // save as draft button, do not changet the rfqStatus
  @Post('/draft')
  async createDraftBid(@CurrentUser() user: User, @Body() body: CreateDraftBidDto) {
    return await this.bidsService.create(user, body, true)
  }
}
