import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PDFModule, PDFModuleOptions } from '@t00nday/nestjs-pdf';
import { CreatePDFService } from './create-pdf.service';
import { User } from 'src/users/entities/user.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PDFModule.registerAsync({
      useFactory: (): PDFModuleOptions => ({
        view: {
          root: './src/create-pdf/templates',
          engine: 'ejs',
        },
      }),
    }),
    ConfigModule,
  ],
  providers: [CreatePDFService],
  exports: [CreatePDFService],
  controllers: [],
})
export class CreatePDFModule {}
