import { BadRequestException, HttpCode, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, getRepository, Not, Repository } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import { Customer } from 'src/customers/entities/customer.entity';

import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';

import { _ } from 'lodash';
const numeral = require('numeral');
import { format } from 'date-fns';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}
  async getAll(currentUser: User) {
    try {
      const query = this.customerRepo
        .createQueryBuilder('u')
        .where('u.status = :status AND u.userAffiliation = :userAffiliation AND u.companyId = :companyId', {
          status: 1,
          userAffiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
        })
        .select([
          'u.id',
          'u.customerId',
          'u.fullName',
          'u.createdAt',
          'u.companyName',
        ]);

      return await query.getMany();
    } catch (err) {
      throw new err();
    }
  }

  async getPaged(
    page: number,
    perpage: number,
    filter: string,
    sort: string,
    createdAt: string,
    currentUser: User,
  ) {
    try {
      const limit = perpage;
      const offset = perpage * (page - 1);

      const allCustomerData = await this.getAll(currentUser);
      if(!_.size(allCustomerData)){
        throw new HttpException('No content', HttpStatus.NO_CONTENT)
      }

      let query = await this.customerRepo
        .createQueryBuilder('u')
        .select([
          'u.id',
          'u.customerId',
          'u.fullName',
          'u.createdAt',
          'u.companyName',
        ])
        .where('u.status = :status AND u.userAffiliation = :userAffiliation AND u.companyId = :companyId', {
          status: 1,
          userAffiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
        });

      if (filter) {
        query = query.andWhere(
          `(u.fullName like :filter OR 
              u.customerId like :filter OR
              u.companyName like :filter)`,
          { filter: `%${filter}%` },
        );
      }

      if (createdAt) {
        const from = createdAt.split('to')[0];
        const until = createdAt.split('to')[1];
        query = query.andWhere(
          `(DATE(u.createdAt) >= :from AND 
              DATE(u.createdAt) <= :until)`,
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

      const data = await query.limit(limit).offset(offset).getMany();
      const totalShowed = _.size(data);

      return {
        page,
        totalRecord,
        totalShowed,
        totalPage: Math.ceil(totalRecord / limit),
        showing: `${totalRecord ? offset + 1 : 0} - ${offset + totalShowed} of ${totalRecord}`,
        next: offset + totalShowed !== totalRecord,
        data,
      };
    } catch (err) {
      throw err;
    }
  }

  async getDetail(id: number, currentUser: User) {
    try {
      const user = await this.customerRepo.findOne({
        id,
        status: 1,
        userAffiliation: currentUser.affiliation,
        companyId: currentUser.companyId,
      });
      if (user == null) {
        throw new NotFoundException();
      }
      return await this.customerRepo
        .createQueryBuilder('u')
        .select([
          'u.id',
          'u.customerId',
          'u.fullName',
          'u.createdAt',
          'u.companyName',
          'u.address',
          'u.npwp',
          'u.phoneCode',
          'u.phoneNumber',
          'u.customerType',
          'u.email',
        ])
        .where(
          'u.status = :status and u.id = :id',
          {
            status: 1,
            id,
          },
        )
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  async create(data: CreateCustomerDto, currentUser: User) {
    try {
      const regex = /[^A-Za-z\u00C0-\u024F\u1E00-\u1EFF\-\’\.\'\s]/;
      if (data.fullName.search(regex) !== -1) {
        throw new BadRequestException('Name contains invalid character');
      }

      const duplicateEmail = await this.customerRepo.findOne({
        where: {
          email: data.email,
          status: 1,
          userAffiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
        },
      });

      if (duplicateEmail) {
        throw new BadRequestException('Email is already used');
      }

      let duplicateCompany = await this.customerRepo.findOne({
        where: {
          companyName: data.companyName,
          status: 1,
          userAffiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
        },
      });

      if (duplicateCompany) {
        throw new BadRequestException('Company already exists');
      }

      let duplicatePhone = await this.customerRepo.findOne({
        where: {
          phoneCode: data.phoneCode,
          phoneNumber: data.phoneNumber,
          status: 1,
          userAffiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
        },
      });

      if (duplicatePhone) {
        throw new BadRequestException('Phone number is already used');
      }

      let duplicateNpwp = await this.customerRepo.findOne({
        where: {
          npwp: data.npwp,
          status: 1,
          userAffiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
        },
      });

      if (duplicateNpwp) {
        throw new BadRequestException('NPWP is already used');
      }

      const countCustomerBefore = await this.customerRepo
        .createQueryBuilder('u')
        .select('COUNT(u.customerId)', 'count')
        .where('u.userAffiliation = :userAffiliation AND u.companyId = :companyId', {
          userAffiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
        })
        .getRawOne();

      const uniqueId = parseInt(countCustomerBefore.count, 10) + 1;
      const randomNumber = Math.floor(Math.random() * 10000000);
      const customerId = `${numeral(uniqueId).format('0000')}-${numeral(
        randomNumber,
      ).format('0000000')}`;
      const user = await this.customerRepo.create({
        customerId,
        createdByUserId: currentUser.userId,
        userAffiliation: currentUser.affiliation,
        companyId: currentUser.companyId,
        ...data,
      });
      return await this.customerRepo.save(user);
    } catch (err) {
      throw err;
    }
  }

  async update(id: number, data: UpdateCustomerDto, currentUser: User) {
    try {
      const regex = /[^A-Za-z\u00C0-\u024F\u1E00-\u1EFF\-\’\.\'\s]/;

      if (data.fullName.search(regex) !== -1) {
        throw new BadRequestException('Name contains invalid character');
      }

      const user = await this.customerRepo.findOne({
        id,
        status: 1,
        userAffiliation: currentUser.affiliation,
        companyId: currentUser.companyId,
      });
      if (user == null) {
        throw new NotFoundException();
      }

      if (data.email) {
        const duplicateEmail = await this.customerRepo.findOne({
          where: {
            email: data.email,
            id: Not(Equal(id)),
            status: 1,
            userAffiliation: currentUser.affiliation,
            companyId: currentUser.companyId,
          },
        });

        if (duplicateEmail) {
          throw new BadRequestException('Email is already used');
        }
      }

      if (data.companyName) {
        const duplicateCompany = await this.customerRepo.findOne({
          where: {
            companyName: data.companyName,
            id: Not(Equal(id)),
            status: 1,
            userAffiliation: currentUser.affiliation,
            companyId: currentUser.companyId,
          },
        });

        if (duplicateCompany) {
          throw new BadRequestException('Company already exists');
        }
      }

      let duplicatePhone = await this.customerRepo.findOne({
        where: {
          id: Not(Equal(id)),
          phoneCode: data.phoneCode,
          phoneNumber: data.phoneNumber,
          status: 1,
          userAffiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
        },
      });

      if (duplicatePhone) {
        throw new BadRequestException('Phone number is already used');
      }

      let duplicateNpwp = await this.customerRepo.findOne({
        where: {
          id: Not(Equal(id)),
          npwp: data.npwp,
          status: 1,
          userAffiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
        },
      });

      if (duplicateNpwp) {
        throw new BadRequestException('NPWP is already used');
      }
      
      const updatedUser = await this.customerRepo
        .createQueryBuilder()
        .update(Customer)
        .set({
          updatedByUserId: currentUser.userId,
          ...data,
        })
        .where('id = :id', { id })
        .execute();

      if (updatedUser.affected === 1) {
        return await this.getDetail(id, currentUser);
      }

      throw new InternalServerErrorException();
    } catch (err) {
      throw err;
    }
  }

  async delete(id: number, currentUser: User) {
    try {
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      const customer = await this.customerRepo.findOne({
        id,
        status: 1,
        userAffiliation: currentUser.affiliation,
        companyId: currentUser.companyId,
      });
      if (customer == null) {
        throw new NotFoundException();
      }
      const deletedUser = await this.customerRepo
        .createQueryBuilder()
        .update(Customer)
        .set({
          status: 0,
          deletedByUserId: currentUser.userId,
          deletedAt: currentDate,
        })
        .where('id = :id', { id })
        .execute();

      if (deletedUser.affected === 1) {
        return {
          message: 'Item deleted successfully',
        };
      }
      throw new InternalServerErrorException();
    } catch (err) {
      throw err;
    }
  }
}
