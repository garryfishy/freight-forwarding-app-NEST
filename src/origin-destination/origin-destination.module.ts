import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from 'src/origin-destination/entities/country.entity';
import { OriginDestination } from './entities/origin-destination.entity';
import { OriginDestinationService } from './origin-destination.service';

@Module({
  providers: [OriginDestinationService, OriginDestination],
  exports: [OriginDestinationService],
  imports: [TypeOrmModule.forFeature([OriginDestination, Country])],
})
export class OriginDestinationModule {}
