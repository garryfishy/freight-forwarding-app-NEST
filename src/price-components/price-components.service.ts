import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepository, Repository, Not } from 'typeorm';
import { format } from 'date-fns';
import { PriceComponent } from './entities/price-component.entity';
import { CreatePriceComponentDto } from './dtos/create-price-component.dto';
import { UpdatePriceComponentDto } from './dtos/update-price-component.dto';
import { _ } from 'lodash';

@Injectable()
export class PriceComponentsService {
  constructor(
    @InjectRepository(PriceComponent) private priceComponentRepo: Repository<PriceComponent>,
  ) {}

  async getAll() {
    return await this.priceComponentRepo.find({status: 1});
  }

  async getPaged(page: number, perpage: number, filter: string, sort: string) {
    try{
      const limit = perpage;
      const offset = perpage * (page - 1);

      let query = getRepository(PriceComponent)
        .createQueryBuilder('pc')
        .select(['pc.id', 'pc.code', 'pc.name'])
        .where('pc.status = :status', { status: 1 });

      const allPriceCompData = await this.getAll();
      if(!_.size(allPriceCompData)){
        throw new HttpException('No content', HttpStatus.NO_CONTENT)
      }

      if (filter){
        query = query.andWhere(
          `(pc.code like :filter OR 
            pc.name like :filter)`,
          { filter: `%${filter}%` },
        );
      }

      if (sort && (sort === "ASC" || sort === "DESC")){
        query.orderBy('pc.name', sort);
      } else {
        query.orderBy('pc.updatedAt', 'DESC');
      }

      const allData = await query.getMany();
      const totalRecord = _.size(allData);

      const data = await query
      .limit(limit)
      .offset(offset)
      .getMany();
      const totalShowed = _.size(data)

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
      const priceComp = await getRepository(PriceComponent)
        .createQueryBuilder('pc')
        .select(['pc.id', 'pc.code', 'pc.name'])
        .where('pc.status = :status AND pc.id = :id', { status: 1, id })
        .getOne()

      if (priceComp == null) {
        throw new NotFoundException()
      }
      return priceComp
    } catch (err) {
      throw err;
    }
  }

  async create(data: CreatePriceComponentDto, user: User) {
    try{
      const duplicateCode = await this.priceComponentRepo.findOne({
        where: {
          code: data.code,
          status: 1,
        },
      });

      if (duplicateCode) {
        throw new BadRequestException('Component Code already exists');
      }

      const duplicateName = await this.priceComponentRepo.findOne({
        where: {
          name: data.name,
          status: 1,
        },
      });

      if (duplicateName) {
        throw new BadRequestException('Component Name already exists');
      }

      const priceComp = await this.priceComponentRepo.create({
        createdBy: user.userId,
        ...data,
      });
      return await this.priceComponentRepo.save(priceComp);
    } catch (err) {
      throw err;
    }
  }

  async update(id: number, data: UpdatePriceComponentDto, user: User) {
    try {
      const priceComp = await this.priceComponentRepo.findOne({ id, status: 1 });
      if (priceComp == null) {
        throw new NotFoundException();
      }

      const duplicateCode = await this.priceComponentRepo.findOne({
        where: {
          code: data.code,
          status: 1,
          id: Not(id),
        },
      });

      if (duplicateCode) {
        throw new BadRequestException('Component Code already exists');
      }

      const duplicateName = await this.priceComponentRepo.findOne({
        where: {
          name: data.name,
          status: 1,
          id: Not(id),
        },
      });

      if (duplicateName) {
        throw new BadRequestException('Component Name already exists');
      }
      const updatedPriceComp = await this.priceComponentRepo
        .createQueryBuilder()
        .update(PriceComponent)
        .set({
          updatedBy: user.userId,
          ...data
        })
        .where('id = :id', { id })
        .execute();

      if (updatedPriceComp.affected === 1) {
        return await this.getDetail(id)
      }
    } catch (err) {
      throw err;
    }

  }

  async delete(id: number, user: User) {
    try{
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      const priceComp = await this.priceComponentRepo.findOne({ id, status: 1 });
      if (priceComp == null) {
        throw new NotFoundException()
      }
      const deletePriceComp = await this.priceComponentRepo
        .createQueryBuilder()
        .update(PriceComponent)
        .set({
          status: 0,
          deletedBy: user.userId,
          deletedAt: currentDate,
        })
        .where('id = :id', { id })
        .execute();

      if (deletePriceComp.affected === 1) {
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
