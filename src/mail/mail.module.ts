import { SesModule } from '@nextnm/nestjs-ses';
import {Module} from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot(),
    SesModule.forRoot({
      AKI_KEY: process.env.AKI_SES_KEY,
      SECRET: process.env.AWS_SES_SECRET,
      REGION: process.env.AWS_REGION,
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}