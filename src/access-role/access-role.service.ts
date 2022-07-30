import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AccessRoleService {
  constructor(
  ) {}

  async getCompanyMenuAccess(currentUser: User) {
    // return await this.accessMenuCompanyRepo
    //   .createQueryBuilder('am')
    //   .innerJoinAndSelect('am.company', 'c', 'c.id = :companyId', {companyId: currentUser.companyId})
    //   .getMany();
  }
}
