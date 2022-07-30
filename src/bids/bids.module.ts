import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Helper } from 'src/helpers/helper';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { RedisModule } from 'src/redis/redis.module';
import { User } from 'src/users/entities/user.entity';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { BidPrice } from './entities/bid-price.entity';
import { Bid } from './entities/bid.entity';

@Module({
  controllers: [BidsController],
  providers: [BidsService, Helper],
  imports:[
    TypeOrmModule.forFeature([Bid, BidPrice, Quotation, User]),
    RedisModule,
  ],
  exports: [BidsService]
})
export class BidsModule {}
