import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { User } from 'src/users/entities/user.entity';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { CronService } from './cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, User]),
    WhatsappModule,
  ],
  providers: [CronService],
  exports: [CronService]
})
export class CronModule {}