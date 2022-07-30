import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity'
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RedisModule } from '../redis/redis.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { RolesGuard } from './roles.guard'
import { MongooseModule } from '@nestjs/mongoose';
import { UserHistory, UserHistorySchema } from 'src/schemas/userHistory.schema';
import { ApiKeyStrategy } from './api-key.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([User]),
    MongooseModule.forFeature([{ name: UserHistory.name, schema: UserHistorySchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
        },
      }),
    }),
    RedisModule,
    CompaniesModule
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, ApiKeyStrategy],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
