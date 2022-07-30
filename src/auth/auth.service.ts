import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import { getConnection, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

import { RedisService } from '../redis/redis.service'

import { User } from '../users/entities/user.entity'
import { UserHistory, UserHistoryDocument } from 'src/schemas/userHistory.schema';
import { format } from 'date-fns';
import { Role } from 'src/enums/enum';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectModel(UserHistory.name) private userHistoryModel: Model<UserHistoryDocument>
  ) {}

  async login(email: string, password: string) {
    try {
      // TODO add affiliation in where CARDIG or NOT CARDIG
      const user = await this.userRepo
        .createQueryBuilder('u')
        .innerJoinAndSelect('u.company', 'c')
        .leftJoinAndSelect('u.menus', 'm')
        .where(`
          u.email = :email 
          AND NOT u.role = :role 
          AND u.status = :status 
          AND c.status = :status
        `)
        .setParameters({
          email, 
          role: Role.SUPER_ADMIN,
          status: 1
        })
        .getOne()

      if (!user) {
        throw new UnauthorizedException('Email and/or password is incorrect');
      }

      if(user.userStatus === 'OPEN' && user.password){
        throw new UnauthorizedException('Your account is being suspended. Please contact your Admin.')
      }
  
      if (user.userStatus === 'OPEN') {
        throw new UnauthorizedException('Please verify your email address');
      }
  
      const isEqual = bcrypt.compareSync(password, user.password)
      if (!isEqual) {
        throw new UnauthorizedException('Email and/or password is incorrect');
      }

      const isNewMember = user.lastLogin ? false : true


  
      const loggedAt = new Date()
      user.lastLogin = loggedAt
      this.userRepo.save(user)

  
      await this.userHistoryModel.create({
        fullName: user.fullName,
        email: user.email,
        companyName: user.affiliation.toLowerCase() === 'cardig' ? 'Cardig' : `${user.company.name} - ${user.affiliation}`,
        lastAccessTime: null, 
        loginTime: format(new Date(), 'Pp').split(',').join(' at')
      })
      
      const menu = await
      getConnection()
      .createQueryBuilder()
      .from('m_menus', 'menu')
      .where('is_menu = 1')
      .getRawMany()


      let same = menu.filter(o1 => user.menus.some(o2 => o1.id === o2.id));

      let result = []

      let menus =  same.map(e => {
        e['permission'] = true
        return e
      })

      menus.map(e => {
        if (!e.parent_id) {
          result.push({
            id: e.id,
            name: e.slug,
            title: e.name,
            icon: e.icon,
            route: e.route,
            position: e.position,
            permission: e.permission,
            child: []
          })
        }
      })

      result = result.map(e => {
        menus.map (el => {
          if(el.parent_id === e.id){
            e.child.push({
              id: el.id,
              name: el.slug,
              title: el.name,
              icon: el.icon,
              route: el.route,    
              position: el.position,
              permission: el.permission,
              child: []
            })
          }
        })
        return e
      })

      result.map(e => {
        e.child.map(el => {
          menus.map(el2 => {
            if(el2.parent_id === el.id){
              el.child.push({
                id: el2.id,
                name: el2.slug,
                title: el2.name,
                icon: el2.icon,
                route: el2.route,    
                position: el2.position,
                permission: el2.permission,
                child: []
              })
            }
            delete el2.id
          })
          delete el.id
        })
        e.child.sort(function(a, b) { 
          return - ( b.position - a.position  );
        });
        delete e.id
        return e
      })

      result.sort(function(a, b) { 
        return - ( b.position - a.position );
      });


      const profile = {
        // person data
        userId: user.userId,
        userFullName: user.fullName,
        userEmail: user.email,
        userPhoneCode: user.phoneCode,
        userPhoneNumber: user.phoneNumber,
        userDivision: user.divisionName,
        userStatus: user.userStatus,
        isNewMember,
  
        // company data
        companyId: user.companyId,
        companyName: user.company.name,
        companyAddress: user.company.address,
        companyEmail: user.company.email,
        companyPhoneCode: user.company.phoneCode,
        companyPhoneNumber: user.company.phoneNumber,
        companyThemeColor: user.company.themeColor,
      }
      
      const permission = {
        userAffiliation: user.affiliation, // nle or cardig
        userRole: user.role, // admin, manager, or staff
        userRoleAccess: user.roleAccess, // edit or view
        userMenus: result, // user menu access 
      }
  
      const dataToken = {
        companyId: user.companyId,
        companyName: user.company.name,
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phoneCode: user.phoneCode,
        phoneNumber: user.phoneNumber,
        affiliation: user.affiliation,
        role: user.role,
        roleAccess: user.roleAccess,
        userStatus: user.userStatus,
        status: user.status,
      }
      const token = this.jwtService.sign(dataToken)
  
      await this.redisService.set(
        `session-${user.affiliation}:${user.userId}-${token}`, 
        token, this.configService.get('CACHE_TTL')
      )

      return { 
        session: { loggedAt, token },
        profile,
        permission,
      }
    } catch (error) {
      throw error 
    }
  }

  async logout(user) {
    const { affiliation, userId, fullName, email, companyName } = user

    await this.userHistoryModel.create({
      fullName,
      email,
      companyName: affiliation.toLowerCase() === 'cardig' ? 'Cardig' : `${companyName} - ${affiliation}`,
      lastAccessTime: format(new Date(), 'Pp').split(',').join(' at'), 
      loginTime: null
    })

    await this.redisService.deleteSessions(affiliation, userId);
    
    return { message: 'Logged out' }
  }

}
