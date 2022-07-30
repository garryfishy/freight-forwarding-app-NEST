import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true, // reason: reset ttl redis session
    });
  }

  async validate(payload: any) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.company', 'c', 'c.status = :status')
      .select(['u.userId'])
      .where(
        `u.userId = :userId
        AND u.affiliation = :affiliation
        AND u.status = :status`
      )
      .setParameters({
        userId: payload.userId, 
        affiliation: payload.affiliation,
        status: 1 
        // disabled in order to keep the session alive after change user's email
        // userStatus: 'USERVERIFICATION', 
      })
      .getOne()

    if (!user) {
      throw new UnauthorizedException()
    }

    return { 
      companyId: payload.companyId,
      companyName: payload.companyName,
      userId: payload.userId,
      fullName: payload.fullName,
      email: payload.email,
      phoneCode: payload.phoneCode,
      phoneNumber: payload.phoneNumber,
      affiliation: payload.affiliation,
      userType: payload.userType,
      role: payload.role,
      roleAccess: payload.roleAccess,
      userStatus: payload.userStatus,
      status: payload.status,
    };
  }
}