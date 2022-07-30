import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { Revenue } from './entities/revenue.entity';
import { RevenuesService } from './revenues.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Revenue]),
  ],
  providers: [RevenuesService],
  exports: [RevenuesService]

})
export class RevenuesModule{}
