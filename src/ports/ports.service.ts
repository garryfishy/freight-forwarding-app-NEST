import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getRepository, Not } from 'typeorm';

import { User } from 'src/users/entities/user.entity';

import { format } from 'date-fns';
import { _ } from 'lodash';
import { Port } from './entities/port.entity';
import { CreatePortDto } from './dtos/create-port.dto';
import { UpdatePortDto } from './dtos/update-port.dto';

@Injectable()
export class PortsService {
  constructor(
    private connection: Connection,
    @InjectRepository(Port)
    private portRepo: Repository<Port>,
  ) {}

  async getAll() {
    return await this.portRepo.find({ status: 1 });
  }

  async getPaged(page: number, perpage: number, filter: string, sort: string) {
    try {
      const limit = perpage;
      const offset = perpage * (page - 1);

      const allOriginDestinationData = await this.getAll();
      if (!_.size(allOriginDestinationData)) {
        throw new HttpException('No content', HttpStatus.NO_CONTENT);
      }

      let query = getRepository(Port)
        .createQueryBuilder('p')
        .select(['p.id', 'p.portName'])
        .where('p.status = :status', { status: 1 });

      if (filter) {
        query = query.andWhere(`(p.portName like :filter)`, {
          filter: `%${filter}%`,
        });
      }

      if (sort && (sort === 'ASC' || sort === 'DESC')) {
        query.orderBy('p.portName', sort);
      } else {
        query.orderBy('p.updatedAt', 'DESC');
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
        showing: `${totalRecord === 0 ? 0 : offset + 1} - ${
          offset + totalShowed
        } of ${totalRecord}`,
        next: offset + totalShowed !== totalRecord,
        data,
      };
    } catch (err) {
      throw err;
    }
  }

  async getDetail(id: number) {
    try {
      const route = await this.portRepo.findOne({ id, status: 1 });
      if (!route) {
        throw new NotFoundException();
      }
      return await this.portRepo
        .createQueryBuilder('p')
        .select(['p.id', 'p.portName'])
        .where('p.status = :status AND p.id = :id', { status: 1, id })
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  async create(data: CreatePortDto, user: User) {
    try {
      const duplicatePort = await this.portRepo.findOne({
        where: {
          ...data,
          status: 1,
        },
      });

      if (duplicatePort) {
        throw new BadRequestException('Data already exists');
      }

      const port = await this.portRepo.create({
        createdBy: user.userId,
        ...data,
      });
      return await this.portRepo.save(port);
    } catch (err) {
      throw err;
    }
  }

  async update(id: number, data: UpdatePortDto, user: User) {
    try {
      const route = await this.portRepo.findOne({ id, status: 1 });
      if (!route) {
        throw new NotFoundException();
      }
      const duplicatePort = await this.portRepo.findOne({
        where: {
          ...data,
          status: 1,
          id: Not(id),
        },
      });

      if (duplicatePort) {
        throw new BadRequestException('Data already exists');
      }

      const updatedPort = await this.portRepo
        .createQueryBuilder()
        .update(Port)
        .set({
          updatedBy: user.userId,
          ...data,
        })
        .where('id = :id', { id })
        .execute();

      if (updatedPort.affected === 1) {
        return await this.getDetail(id);
      }
    } catch (err) {
      throw err;
    }
  }

  async delete(id: number, user: User) {
    try {
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      const port = await this.portRepo.findOne({ id, status: 1 });

      if (port == null) {
        throw new NotFoundException();
      }

      const deletePort = await this.portRepo
        .createQueryBuilder()
        .update(Port)
        .set({
          status: 0,
          deletedBy: user.userId,
          deletedAt: currentDate,
        })
        .where('id = :id', { id })
        .execute();

      if (deletePort.affected === 1) {
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
