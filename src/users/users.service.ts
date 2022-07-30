import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Connection, getConnection, QueryRunner, Repository, Not, Equal, getRepository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { _ } from 'lodash'

import { Crypto } from 'src/utilities/crypto'

import { CompaniesService } from '../companies/companies.service'

import { UserRegistDto } from './dtos/user-regist.dto'
import { MailService } from '../mail/mail.service'
import { User } from './entities/user.entity'
import { Company } from 'src/companies/entities/company.entity'
import { RedisService } from 'src/redis/redis.service'
import { UpdateUserDto } from 'src/settings/dtos/update-user.dto'
import { CreateUserDto } from './dtos/create-user.dto'
import { UpdateOtherUserDto } from './dtos/update-other-user-dto'
import { Menu } from 'src/access-role/entities/menu'
import { add, format } from 'date-fns'
import { Role, RoleAccess } from 'src/enums/enum'
import { map } from 'rxjs'
import { UserResetPasswordDto } from './dtos/user-reset-password.dto'

@Injectable()
export class UsersService {
  private queryRunner: QueryRunner;

  constructor(
    private crypto: Crypto,
    private connection: Connection,
    private mailService: MailService,
    private redisService: RedisService,
    private companiesService: CompaniesService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
  ) {
    this.queryRunner = this.connection.createQueryRunner();
  }

  async getSidebar(userId: number){
    try {
      const getMenu = await 
      getRepository(Menu)
      .createQueryBuilder('m')
      .where('m.is_menu = true')
      .orderBy('m.position', 'ASC')
      .select([
        'm.id',
        'm.name',
        'm.slug',
        'm.icon',
        'm.position',
        'm.route',
        'm.parentId',
        'm.isMenu',
      ])
      .getMany();

      const userMenu = await 
      getConnection()
      .createQueryBuilder()
      .from('m_access_menu_users', 'menus')
      .where('user_id = :userId', {userId})
      .getRawMany()

      let same = getMenu.filter(o1 => userMenu.some(o2 => o1.id === o2.menu_id))

      let result = []

      let menus =  same.map(e => {
        e['permission'] = true
        return e
      })

      // let menus =  getMenu.map(e => {
      //   e['permission'] = true
      //   return e
      // })

      menus.map((e,i) => {
        if (!e.parentId) {
          result.push({
            id: e.id,
            name: e.slug,
            title: e.name,
            icon: e.icon,
            route: e.route,
            position: e.position,
            child: []
          })
        }
      })

      result = result.map(e => {
        menus.map (el => {
          if(el.parentId === e.id){
            e.child.push({
              id: el.id,
              name: el.slug,
              title: el.name,
              icon: el.icon,
              route: el.route,    
              position: el.position,
              child: []
            })
          }
        })
        return e
      })

      result.map(e => {
        e.child.map(el => {
          menus.map(el2 => {
            if(el2.parentId === el.id){
              el.child.push({
                id: el2.id,
                name: el2.slug,
                title: el2.name,
                icon: el2.icon,
                route: el2.route,    
                position: el2.position,
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

  
      return result
    } catch (error) {
      throw error
    }
  }

  async findById(userId: number, companyId: number) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .innerJoinAndSelect('u.company', 'c')
      .leftJoinAndSelect('u.menus', 'm')
      .where(`
        u.userId = :userId 
        AND u.companyId = :companyId 
        AND NOT u.role = :role 
        AND u.status = :status 
        AND c.status = :status
      `)
      .setParameters({
        userId, 
        companyId,
        role: Role.SUPER_ADMIN,
        status: 1
      })
      .getOne()

    if (!user) {
      throw new NotFoundException();
    }

    const isNewMember = user.lastLogin ? false : true

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
    };

    const permission = {
      userAffiliation: user.affiliation, // nle or cardig
      userRole: user.role, // admin, manager, or staff
      userRoleAccess: user.roleAccess, // edit or view
      userMenus: result
      // user menu access 
    }
    

    return { 
      profile, 
      permission 
    }

  }

  async getAllUsers(
    affiliation,
    page: number,
    perpage: number,
    filter: string,
    sort: string,
    createdAt: string,
    currentUser: User
    ){
    try {
      const limit = perpage;
      const offset = perpage * (page - 1);
      
      let query = await this.userRepo
      .createQueryBuilder('u')
      .where('u.affiliation = :affiliation', {affiliation})
      .andWhere('u.status = 1')
      .select(
        [
          'u.fullName',
          'u.email',
          'u.role',
          'u.userStatus',
          'u.password',
          'u.userId',
          'u.divisionName'
        ]
      )
      if (filter) {
        query = query
        .andWhere('((u.fullName like :filter) OR (u.email like :filter) OR (u.role like :filter))',       { filter: `%${filter}%` })
      }
      if (createdAt) {
        const from = createdAt.split('to')[0];
        const until = createdAt.split('to')[1];
        query = query
        .andWhere(
          `(DATE(q.createdAt) >= :from AND DATE(q.createdAt) <= :until)`,
          { from, until },
        );
      }
      if (sort && (sort === 'ASC' || sort === 'DESC')) {
        query.orderBy('u.fullName', sort);
      } else {
        query.orderBy('u.updatedAt', 'DESC');
      }
      const allData = await query.getMany();
      const totalRecord = _.size(allData);     
      let data = await query.limit(limit).offset(offset).getMany();

      data.map(e => {
        e.userStatus = e.userStatus === 'OPEN' && !e.password ? 'Pending' : e.userStatus === 'USERVERIFICATION' && e.password ? 'Active' : 'NonActive'
        e['isActive'] = e.userStatus === 'Pending' ? true : e.userStatus === 'Active' ? true : false
  
        delete e.password
      })

      const totalShowed = _.size(data);
      return {
        page,
        totalRecord,
        totalShowed,
        totalPage: Math.ceil(totalRecord / limit),
        showing: `${totalRecord === 0 ? 0 : offset + 1} - ${
          offset + totalShowed
        } of ${totalRecord}`,
        next: offset + totalShowed !== totalRecord,
        data
      };
    } catch (error) {
      throw error
    }
  }
  async getMenu(user: User){
    try {

      let query = await
      getConnection()
      .createQueryBuilder()
      .from('c_companies', 'c')
      .leftJoin('c.menus', 'menus')
      .where('c.id = :companyId', {companyId: user.companyId})
      .select(['menus'])
      .getRawMany()

      let result = []
      query.forEach((e,i) => {
        if (!e.menus_parent_id ) {
          result.push({
            id: e.menus_id,
            menu_name: e.menus_name,
            position: e.menus_position,
            permission: false,
            children: []
          })
        }
      })
      result = result.map(e => {
        query.map (el => {
          if(el.menus_parent_id === e.id){
            e.children.push({
              id: el.menus_id,
              menu_name: el.menus_name,
              position: el.menus_position,
              permission: false,
              children: []
            })
          }
        })
        return e
      })

      result.map((e,i) => {
        e.children.map(el => {
          query.map(el2 => {
            if(el2.menus_parent_id === el.id){
              el.children.push({
                id: el2.menus_id,
                menu_name: el2.menus_name,
                position: el2.menus_position,
                permission: false,
                children: []
              })
            }
          })
        })
        e.children.sort(function(a, b) { 
          return - ( b.position - a.position  );
        });
        return e
      })

      result = result.filter(function (el) {
        if(el.menu_name.toLowerCase() === 'place order'){
          el.menu_name = 'Create Shipment'
        }
        return  el.menu_name.toLowerCase() !== 'settings'
      });


      result.sort(function(a, b) { 
        return - ( b.position - a.position );
      });



      return result
      
    } catch (error) {
      throw error
    }
  }

  async create(body: UserRegistDto) {
    try {
      const { 
        fullName, 
        email, 
        password, 
        phoneCode, 
        phoneNumber, 
        // companyName 
      } = body

      const result = await this.connection.transaction(async (entityManager) => {
        const user = await this.userRepo.findOne({ email })
        if (user) {
          throw new BadRequestException('You email has been already registered')
        }

        // const company = await this.companiesService.findByName(companyName);
        // if (company) {
        //   throw new BadRequestException('Your company has been already registered')
        // }
      
        const userPhone = await this.userRepo.findOne({ phoneCode, phoneNumber })
        if (userPhone) {
          throw new BadRequestException('You phone number has been already registered')
        }

        // const newCompany = entityManager.create(Company, {
        //   name:  companyName
        // })
        // const { id: companyId } = await entityManager.save(newCompany)
      
        const newUser = entityManager.create(User, { 
          companyId: 1,
          fullName, 
          email, 
          password,
          phoneCode, 
          phoneNumber,
          affiliation: 'CARDIG',
          role: Role.STAFF,
          roleAccess: RoleAccess.EDIT,
          createdBy: 'SELF',
        })

        return await entityManager.save(newUser)
      })

      await this.sendVerificationMail(email);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async resetPasswordMail(email: string) {
    try {
      const user = await this.userRepo.findOne({ email });
      if (!user) {
        throw new BadRequestException('Email is not registered');
      }
      if (user.userStatus === 'OPEN') {
        throw new BadRequestException('Please verify your email address');
      }

      const data = { 
        email, 
        expiredDate: format(add(new Date(), { hours: 1 }), 'yyyy-MM-dd HH:mm:ss') 
      };

      const encryptedData = this.crypto.encrypt(data);

      await this.redisService.set(encryptedData, encryptedData, 3600);

      const forEmail = {
        email,
        name: user.fullName,
        code: encryptedData,
        url: '',
        endpoint: ''
      };
      await this.mailService.sendUserConfirmation(forEmail, 'forgot-password');

      return { code: encryptedData };
    } catch (error) {
      throw error;
    }
  }

  async checkResetPasswordCode(code: string) {
    try {
      const cache = await this.redisService.get(code);
    
      if (!cache) {
        throw new BadRequestException(
          'Your request to reset your password has expired. Please try again.',
        );
      }
      return { message: 'Code is valid'};
    } catch (error) {
      throw error;
    }
  }

  async resetPassword( body: UserResetPasswordDto) {
    try {
      const {code, phoneCode, phoneNumber, password} = body
      const cache = await this.redisService.get(code);
      if (!cache) {
        throw new BadRequestException(
          'Your request to reset your password has expired. Please try again.',
        );
      }

      const decryptedData = this.crypto.decrypt(code);
      const data = JSON.parse(decryptedData);
      const { email } = data;

      const user = await this.userRepo.findOne({ email });

      if(user.userStatus === 'OPEN'){
        user.userStatus = 'USERVERIFICATION'
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      user.password = hashedPassword;
      user.updatedByUserId = user.userId;
      if(!user.phoneCode && !user.phoneNumber){
        user.phoneCode = phoneCode
        user.phoneNumber = phoneNumber
      }

      await this.userRepo.save(user);

      await this.redisService.del(code);

      // TODO: delete login session

      return { message: 'Successfully changed password' };
    } catch (error) {
      throw error;
    }
  }

  async sendVerificationMail(email: string) {
    try {
      const user = await this.userRepo.findOne({ email });
      if (!user) {
        throw new BadRequestException();
      }

      const data = { 
        email,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss') 
      };
      const encryptedData = this.crypto.encrypt(data);


      const forEmail = {
        email,
        code: encryptedData,
        name: user.fullName,
        url: '',
        endpoint: ''
      };
      await this.mailService.sendUserConfirmation(forEmail, 'register');

      return { code: encryptedData };
    } catch (error) {
      throw error;
    }
  }

  async sendPasswordEmail(email: string) {
    try {
      const user = await this.userRepo.findOne({ email });
      if (!user) {
        throw new BadRequestException();
      }


      const data = { 
        email,
        expiredDate: format(add(new Date(), { hours: 1 }), 'yyyy-MM-dd HH:mm:ss') 
      };
      const encryptedData = this.crypto.encrypt(data);

      await this.redisService.set(encryptedData, encryptedData, 604800);
      
      const forEmail = {
        email,
        code: encryptedData,
        name: user.fullName,
        url: '',
        endpoint: '',
      };

      await this.mailService.sendUserConfirmation(forEmail, 'new-password');

      return { code: encryptedData };
    } catch (error) {
      throw error;
    }
  }

  async sendVerification(userId: number, code: string) {
    try {
      const decryptedData = this.crypto.decrypt(code);
      const data = JSON.parse(decryptedData);
      const { email } = data;

      const user = await this.userRepo.findOne({ email });

      user.userStatus = 'USERVERIFICATION';
      user.updatedByUserId = userId;
      await this.userRepo.save(user);

      return { message: 'Successfully verified your account' };
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(userId: number, password: string) {
    const user = await this.userRepo.findOne({ userId });
    if (!user) {
      throw new NotFoundException();
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    user.password = hashedPassword;
    user.updatedByUserId = userId;

    return await this.userRepo.save(user);
  }

  async update(currentUser: User, type: string, body: UpdateUserDto) {
    const user = await this.userRepo.findOne({ userId: currentUser.userId });
    if (!user) {
      throw new NotFoundException();
    }

    const { fullName, email, phoneCode, phoneNumber, role } = body;

    if (type === 'fullName' && fullName) {
      user.fullName = fullName;

    // } else if (type === 'email' && email) {
    //   const isEmailExist = await this.userRepo
    //     .createQueryBuilder('u')
    //     .where('u.email = :email AND NOT u.userId = :userId')
    //     .setParameters({ email, userId: user.userId })
    //     .getCount()
    //   if (isEmailExist) {
    //     throw new BadRequestException('This email is already used');
    //   }
    //   user.email = email;
    //   user.userStatus = 'OPEN';

    } else if (type === 'phone' && phoneCode && phoneNumber) {
      const isPhoneExist = await this.userRepo
        .createQueryBuilder('u')
        .where('u.phoneCode = :phoneCode AND u.phoneNumber = :phoneNumber AND NOT u.userId = :userId')
        .setParameters({ phoneCode, phoneNumber, userId: user.userId })
        .getCount()
      if (isPhoneExist) {
        throw new BadRequestException('This phone number is already used');
      }
      user.phoneCode = phoneCode;
      user.phoneNumber = phoneNumber;

    // } else if (type === 'role' && role) {
    //   const users = await this.userRepo.count({
    //     affiliation: user.affiliation,
    //     companyId: user.companyId,
    //     role: 'admin',
    //     userStatus: 'USERVERIFICATION',
    //     status: 1,
    //   });
    //   if (
    //     users <= 1 &&
    //     user.role.toLowerCase() === 'admin' &&
    //     role.toLowerCase() !== 'admin'
    //   ) {
    //     throw new BadRequestException(
    //       'Admin is needed. Please assign another member to be an admin first.',
    //     );
    //   }
    //   user.role = body.role;
    } else {
      throw new BadRequestException();
    }

    user.updatedByUserId = currentUser.userId;
    return await this.userRepo.save(user);
  }

  async updatePhoto(userId: number, photo: string) {
    const user = await this.userRepo.findOne({ userId });
    if (!user) {
      throw new NotFoundException();
    }
    user.photo = photo;
    user.updatedByUserId = userId;
    return await this.userRepo.save(user);
  }

  async getUserProfile(userId: number) {
    const user = await this.userRepo.findOne({ userId });
    return {
      fullName: user.fullName,
      phoneCode: user.phoneCode,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      fileContainer: user.fileContainer,
      photo: user.photo,
    };
  }

  async createUserFromSettings(newUser: CreateUserDto, currentUser: User) {
    try {
      await this.queryRunner.connect()
      await this.queryRunner.startTransaction()
      const emailDupe = await this.userRepo.findOne({email: newUser.email})
      if(emailDupe){
        throw new BadRequestException(
          'Email is already used'
        )
      }
      const createUser = await this.userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
      ...newUser,
      divisionName: newUser.jobTitle,
      password: null,
      role: newUser.role.toLowerCase(),
      companyId: currentUser.companyId,
      affiliation: currentUser.affiliation,
      createdBy: 'ADMIN',
      createdByUserId: currentUser.userId})
      .execute()


      if(createUser){
        let tmp = []
        let createMenuAccess = []

        if(newUser.menuAccess && newUser.menuAccess.length > 0){
          const findAccess = newUser.menuAccess.map(e => {
            if(e.permission){
              tmp.push(e)
            }
            return e
          })
        }

        if(newUser.role.toLowerCase() === 'admin'){
          const getAllMenu = await
          getConnection()
          .createQueryBuilder()
          .from('m_menus', 'm')
          .where('is_menu = 1')
          .getRawMany()

          getAllMenu.map(e => {
            createMenuAccess.push({menu_id: e.id, user_id: createUser.generatedMaps[0].userId})
          })
        }else{

          const getSettings = await
          getConnection()
          .createQueryBuilder()
          .from('m_menus', 'm')
          .where('name = "settings" OR name = "my profile"')
          .getRawMany()
          
          getSettings.map(e => {
            createMenuAccess.push({menu_id: e.id, user_id: createUser.generatedMaps[0].userId})
          })
        }


        tmp.map(e => {
          createMenuAccess.push({
            menu_id: e.id,
            user_id: createUser.generatedMaps[0].userId,
          })
          e.children.map(el => {
            if(el.permission){
              createMenuAccess.push({
                menu_id: el.id,
                user_id: createUser.generatedMaps[0].userId,
              })
            }
            el.children.map(el2 => {
              if(el2.permission){
                createMenuAccess.push({
                  menu_id: el2.id,
                  user_id: createUser.generatedMaps[0].userId,
                })
              }
            })
          })
        })

        await getConnection()
        .createQueryBuilder()
        .insert()
        .into('m_access_menu_users')
        .values(createMenuAccess)
        .execute()
      }
      await this.queryRunner.commitTransaction()
      return await this.sendPasswordEmail(newUser.email);
    } catch (error) {
      await this.queryRunner.rollbackTransaction()
      throw error
    }
  }

  async deleteUser(userId:number, affiliation:string){
    try {
      const findUser = await this.userRepo.findOne({userId})
      if(findUser){
        await this.userRepo.delete({userId})
          return {
            message: "User deleted succesfully"
          }
      }else{
        throw new NotFoundException('User not found')
      }
    
    } catch (error) {
      throw error
    }
  }

  async updateOtherUser(user: UpdateOtherUserDto, currentUser: User){
    const checkUser = await this.userRepo.findOne(user.userId, {
      where: {
        companyId: currentUser.companyId
      }
    })

    if (!checkUser) {
      throw new NotFoundException();
    }

    const duplicateEmail = await this.userRepo.findOne({
      email: user.email,
      userId: Not(Equal(user.userId)),
    });
    if (duplicateEmail) {
      throw new BadRequestException('Email is already used');
    }

    try {
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    let tmp = []
    let createMenuAccess = []
    if(user.menuAccess && user.menuAccess.length > 0){
      const findAccess = user.menuAccess.map(e => {
        if(e.permission){
          tmp.push(e)
        }
        return e
      })
    }


    if(user.role.toLowerCase() === 'admin'){
      const getAllMenu = await
      getConnection()
      .createQueryBuilder()
      .from('m_menus', 'm')
      .where('is_menu = 1')
      .getRawMany()

      getAllMenu.map(e => {
        createMenuAccess.push({menu_id: e.id, user_id: user.userId})
      })
    }else{
      const getSettings = await
      getConnection()
      .createQueryBuilder()
      .from('m_menus', 'm')
      .where('name = "settings" OR name = "my profile"')
      .getRawMany()
      
      console.log(getSettings)
      
      getSettings.map(e => {
        createMenuAccess.push({menu_id: e.id, user_id: user.userId})
      })
    }
    tmp.map(e => {
      createMenuAccess.push({
        menu_id: e.id,
        user_id: user.userId,
      })
      e.children.map(el => {
        if(el.permission){
          createMenuAccess.push({
            menu_id: el.id,
            user_id: user.userId,
          })
        }
        el.children.map(el2 => {
          if(el2.permission){
            createMenuAccess.push({
              menu_id: el2.id,
              user_id: user.userId,
            })
          }
        })
      })
    })

    const findMenu = await
    getConnection()
    .createQueryBuilder()
    .from('m_access_menu_users', 'menu')
    .where('user_id = :userId', {userId: user.userId})
    .getRawMany()

    if(findMenu.length > 0){
      await getConnection()
      .createQueryBuilder()
      .delete()
      .from('m_access_menu_users')
      .where("user_id = :userId",{ userId: user.userId})
      .execute()
    }
    
    let updateUser = await this.userRepo
      .createQueryBuilder('u')
      .update(User)
      .set({
        fullName: user.fullName,
        email: user.email,
        divisionName: user.jobTitle,
        role: user.role.toLowerCase(),
        phoneCode: user.phoneCode.length === 0 ? null : user.phoneCode,
        phoneNumber: user.phoneNumber.length === 0 ? null : user.phoneNumber ,
        userStatus: user.isActive ? 'USERVERIFICATION' : 'OPEN',
        updatedByUserId: currentUser.userId 
        // roleAccess: user.roleAccess,
      })
      .where('userId = :userId', { userId: user.userId })
      .execute()

      await getConnection()
      .createQueryBuilder()
      .insert()
      .into('m_access_menu_users')
      .values(createMenuAccess)
      .execute()

      await this.queryRunner.commitTransaction()
      return Object.assign(updateUser, {user})
    } catch (error) {
      await this.queryRunner.rollbackTransaction();
      throw error;
    }
  }
  async getUserDetail(userId: number){
    try {
      const query = await this.userRepo
      .createQueryBuilder('u')
      .where('u.userId = :userId', {userId})
      .leftJoin('u.menus', 'menus')
      .select([
        'u.fullName',
        'u.email',
        'u.role',
        'u.divisionName',
        'u.companyId',
        'u.userStatus',
        'u.phoneCode',
        'u.phoneNumber',
        'u.password',
        'menus'
      ])
      .getOne()

      query.userStatus = query.userStatus === 'OPEN' && !query.password ? 'Pending' : query.userStatus === 'USERVERIFICATION' && query.password ? 'Active' : 'NonActive'
      query['isActive'] = query.userStatus === 'Pending' ? true : query.userStatus === 'Active' ? true : false
      query['jobTitle'] = query.divisionName

      delete query.divisionName
      delete query.password

      const menu =await
      getConnection()
      .createQueryBuilder()
      .from('c_companies', 'c')
      .leftJoin('c.menus', 'menus')
      .where('c.id = :companyId', {companyId: query.companyId})
      .select(['menus'])
      .getRawMany()


      let same = menu.filter(o1 => query.menus.some(o2 => o1.menus_id === o2.id));
      let different = menu.filter(function(obj) {
        return !query.menus.some(function(obj2) {
            return obj.menus_id == obj2.id;
        });
      });

      same.map(e => {
        e['permission'] = true
        e.children = []
      })
      different.map(e => {
        e['permission'] = false
        e.children = []
      })
      let result = []

      let menus = same.concat(different)


      menus.map(e => {
        if (!e.menus_parent_id) {
          result.push({
            id: e.menus_id,
            menu_name: e.menus_name,
            position: e.menus_position,
            permission: e.permission,
            children: []
          })
        }
      })

      result = result.map(e => {
        menus.map (el => {
          if(el.menus_parent_id === e.id){
            e.children.push({
              id: el.menus_id,
              menu_name: el.menus_name,
              position: el.menus_position,
              permission: el.permission,
              children: []
            })
          }
        })
        return e
      })


      result.sort(function(a, b) { 
        return - ( b.id - a.id );
      });

      result = result.filter(function (el) {
        if(el.menu_name.toLowerCase() === 'place order'){
          el.menu_name = 'Create Shipment'
        }
        return el.menu_name.toLowerCase() !== 'settings'
      });


      query.menus = result
      
      return query
      
    } catch (error) {
      throw error
    }
  }

  async getUsers(companyId: number, affiliation: string) {
    return await this.userRepo.find({ 
      where: {
        companyId, 
        affiliation, 
        userStatus: 'USERVERIFICATION', 
        status: 1
      }, 
      select: ['userId', 'fullName', 'email', 'divisionName'] 
    })
  }
} 

