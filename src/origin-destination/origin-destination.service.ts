import { BadRequestException, HttpCode, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getRepository, Not } from 'typeorm';

import { CreateOriginDestinationDto } from './dtos/create-origin-destination.dto';
import { UpdateOriginDestinationDto } from './dtos/update-origin-destination.dto';

import { User } from 'src/users/entities/user.entity';
import { OriginDestination } from './entities/origin-destination.entity';
import { Country } from 'src/origin-destination/entities/country.entity';

import { format } from 'date-fns';
import { _ } from 'lodash';

@Injectable()
export class OriginDestinationService {
  constructor(
    private connection: Connection,
    @InjectRepository(OriginDestination) private originDestinationRepo: Repository<OriginDestination>,
    @InjectRepository(Country) private countryRepo: Repository<Country>,
  ) {}

  async getAll() {
    return await this.originDestinationRepo.find({ status: 1 });
  }

  async getPaged(page: number, perpage: number, filter: string, sort: string) {
    try{
      const limit = perpage;
      const offset = perpage * (page - 1);

      const allOriginDestinationData = await this.getAll();
      if(!_.size(allOriginDestinationData)){
        throw new HttpException('No content', HttpStatus.NO_CONTENT)
      }

      let query = getRepository(OriginDestination)
        .createQueryBuilder('r')
        .select([
          'r.id',
          'r.countryCode',
          'r.countryName',
          'r.cityCode',
          'r.cityName',
        ])
        .where('r.status = :status', { status: 1 });

      if (filter) {
        query = query.andWhere(
          `(r.countryName like :filter OR 
            r.countryCode like :filter OR 
            r.cityCode like :filter OR 
            r.cityName like :filter)`,
          { filter: `%${filter}%` },
        );
      }

      if (sort && (sort === 'ASC' || sort === 'DESC')) {
        query.orderBy('r.countryName', sort);
      } else {
        query.orderBy('r.updatedAt', 'DESC');
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
    try{
      const route = await this.originDestinationRepo.findOne({ id, status: 1 });
      if (!route) {
        throw new NotFoundException()
      }
      return await this.originDestinationRepo
        .createQueryBuilder('r')
        .select([
          'r.id',
          'r.countryCode',
          'r.countryName',
          'r.cityCode',
          'r.cityName',
        ])
        .where('r.status = :status AND r.id = :id', { status: 1, id })
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  async create(data: CreateOriginDestinationDto, user: User) {
    try{
      const duplicateRoute = await this.originDestinationRepo.findOne({
        where: {
          ...data,
          status: 1
        },
      });

      if (duplicateRoute) {
        throw new BadRequestException('Data already exists');
      }
      
      const duplicateCityCode = await this.originDestinationRepo.findOne({
        where: {
          cityCode: data.cityCode,
          status: 1,
        },
      });

      if (duplicateCityCode) {
        throw new BadRequestException('City code already exists');
      }

      const duplicateCityName = await this.originDestinationRepo.findOne({
        where: {
          countryName: data.countryName,
          cityName: data.cityName,
          status: 1,
        },
      });

      if (duplicateCityName) {
        throw new BadRequestException(
          'Data with the same city name already exists in the same country',
        );
      }

      const country = await this.countryRepo.findOne({
        countryCode: data.countryCode,
      });

      if(country && country.countryName !== data.countryName){
        throw new BadRequestException('Country code already exists');
      } else if(!country){
        const newCountry = await this.countryRepo.create({
          countryCode: data.countryCode,
          countryName: data.countryName,
          createdBy: user.userId,
        });
        await this.countryRepo.save(newCountry);
      }

      const routes = await this.originDestinationRepo.create({
        createdBy: user.userId,
        ...data,
      });
      return await this.originDestinationRepo.save(routes);
    } catch (err) {
      throw err;
    }
  }

  async update(id: number, data: UpdateOriginDestinationDto, user: User) {
    try{
      const route = await this.originDestinationRepo.findOne({ id, status: 1 });
      if (!route) {
        throw new NotFoundException()
      }
      const duplicateRoute = await this.originDestinationRepo.findOne({
        where: {
          countryName: route.countryName,
          countryCode: route.countryCode,
          ...data,
          status: 1,
          id: Not(id),
        },
      });

      if (duplicateRoute) {
        throw new BadRequestException('Data already exists');
      }
      
      const duplicateCityCode = await this.originDestinationRepo.findOne({
        where: {
          cityCode: data.cityCode,
          status: 1,
          id: Not(id),
        },
      });

      if (duplicateCityCode) {
        throw new BadRequestException('City code already exists');
      }

      const duplicateCityName = await this.originDestinationRepo.findOne({
        where: {
          countryName: route.countryName,
          cityName: data.cityName,
          status: 1,
          id: Not(id),
        },
      });

      if (duplicateCityName) {
        throw new BadRequestException(
          'Data with the same city name already exists in the same country',
        );
      }

      const updatedOriginDestination = await this.originDestinationRepo
        .createQueryBuilder()
        .update(OriginDestination)
        .set({
          updatedBy: user.userId,
          ...data,
        })
        .where('id = :id', { id })
        .execute();

      if (updatedOriginDestination.affected === 1) {
        return await this.getDetail(id)
      }
    } catch (err) {
      throw err;
    }
  }

  async delete(id: number, user: User) {
    try{
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      const route = await this.originDestinationRepo.findOne({ id, status: 1 });
      if (route == null) {
        throw new NotFoundException()
      }
      
      const deleteOriginDestination = await this.originDestinationRepo
        .createQueryBuilder()
        .update(OriginDestination)
        .set({
          status: 0,
          deletedBy: user.userId,
          deletedAt: currentDate,
        })
        .where('id = :id', { id })
        .execute();

      if (deleteOriginDestination.affected === 1) {
        return {
          message: 'Item deleted successfully',
        };
      }
      throw new InternalServerErrorException();
    } catch (err) {
      throw err;
    }
  }

  async getCountries() {
    return await this.countryRepo.find()
  }

  async getCitiesByCountry(countryCode: string) {
    return await this.originDestinationRepo
      .createQueryBuilder('routes')
      .where('routes.countryCode = :countryCode', { countryCode })
      .andWhere('routes.status = :status', { status: 1 })
      .select([
        'routes.countryName',
        'routes.cityName',
        'routes.countryCode',
        'routes.cityCode',
      ])
      .getMany()
  }

  async getCityCode(cityName: string) {
    return await this.originDestinationRepo
      .createQueryBuilder('r')
      .where('r.cityName = :cityName', { cityName })
      .andWhere('r.status = :status', { status: 1 })
      .select(['r.cityCode'])
      .getOne()
  }
}
