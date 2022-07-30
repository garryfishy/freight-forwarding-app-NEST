import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, QueryRunner, Repository } from 'typeorm';
import { CreateBidDto } from './dtos/create-bid.dto';
import { BidPrice } from './entities/bid-price.entity';
import { Bid } from './entities/bid.entity';
import { _ } from 'lodash';
import { User } from 'src/users/entities/user.entity';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { RfqStatus } from 'src/enums/enum';
import { UpdateBidDto } from './dtos/update-bid.dto';
import { CreateDraftBidDto } from './dtos/create-draft-bid.dto';

@Injectable()
export class BidsService {
  private queryRunner: QueryRunner;
  
  constructor(
    @InjectRepository(Bid) private bidRepo: Repository<Bid>,
    @InjectRepository(BidPrice) private bidPriceRepo: Repository<BidPrice>,
    @InjectRepository(Quotation) private quotationRepo: Repository<Quotation>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private connection: Connection,
  ) {
    this.queryRunner = connection.createQueryRunner();
  }

  async getDetail(rfqNumber: string, currentUser: User){
    const quotation = await this.quotationRepo
      .createQueryBuilder('q')
      .innerJoinAndSelect('q.customer', 'c', 'c.affiliation = :affiliation AND c.companyId = :companyId')
      .where('q.rfqNumber = :rfqNumber AND q.createdByCompanyId = :companyId')
      .setParameters({
        status: 1,
        rfqNumber,
        companyId: currentUser.companyId,
        affiliation: currentUser.affiliation,
      })
      .getCount();

    if(!quotation){
      throw new NotFoundException('Quotation not found')
    }

    return await this.bidRepo
      .createQueryBuilder('b')
      .innerJoinAndSelect('b.quotation', 'q', 'q.rfqNumber = :rfqNumber', { rfqNumber })
      .leftJoinAndSelect('b.bidprices', 'bp', 'bp.status = :status', { status: 1 })
      .leftJoinAndSelect('bp.priceComp', 'pc')
      .select([
        'b.shippingLine',
        'b.vendorName',
        'b.note',
        'bp.price',
        'bp.uom',
        'bp.note',
        'bp.profit',
        'bp.total',
        'bp.priceCompId',
        'bp.priceCompCode',
        'bp.priceCompName',
      ])
      .getOne();
  }

  // Step 2 and 3
  async create( user: User, body: CreateBidDto | CreateDraftBidDto, isDraft?: boolean) {
    const { rfqId, shippingLine, vendorName, note, bidPrices } = body;

    const quotation = await this.quotationRepo.findOne({ id: rfqId, status: 1})
    if (!quotation) {
      throw new NotFoundException('Quotation not found')
    }
    if (quotation.rfqStatus === RfqStatus.SUBMITTED) {
      throw new BadRequestException('This quotation has been bid submitted');
    }

    const bid = await this.bidRepo.findOne({ rfqId, status: 1 });

    // case: user do "save as draft" beforeward
    if (bid) {
      return await this.connection.transaction(async (entityManager) => {
        // delete previous bidPrices
        const previousBidPrices = await this.bidPriceRepo.find({ bidId: bid.id, status: 1 })
        await entityManager.remove(previousBidPrices)

        // bulkCreate new bidPrices
        const bidPricesWithBidId = bidPrices.map((bidPrice) => {
          return { ...bidPrice, bidId: bid.id, createdByUserId: user.userId }
        })
        const newBidPrices = this.bidPriceRepo.create(bidPricesWithBidId)
        await entityManager.save(newBidPrices)

        // update bid
        Object.assign(bid, {
          shippingLine,
          vendorName,
          note,
          updatedByUserId: user.userId
        })
        await entityManager.save(bid)

        // if next to the Step 3
        if (!isDraft) {
          if ('assignedTo' in body && body.assignedTo) {
            const assignedPerson = await this.userRepo.findOne({ 
              userId: body.assignedTo,
              companyId: user.companyId,
              affiliation: user.affiliation,
              userStatus: 'USERVERIFICATION',
              status: 1,  
            })

            if (!assignedPerson) {
              throw new BadRequestException('Assigned person does not exist')
            }

            Object.assign(quotation, { 
              rfqStatus: RfqStatus.NEED_APPROVAL, 
              assignedTo: body.assignedTo,
              updatedByUserId: user.userId 
            })
          } else {
            Object.assign(quotation, { rfqStatus: RfqStatus.SUBMITTED, updatedByUserId: user.userId })
          }
          
          await entityManager.save(quotation)
        }

        return Object.assign(bid, { bidPrices: newBidPrices });
      })
    }

    // case: user do NOT do "save as draft" beforeward
    return await this.connection.transaction(async (entityManager) => {
      // create bid
      const bid = this.bidRepo.create({
        rfqId,
        shippingLine,
        vendorName,
        note,
        createdByUserId: user.userId,
      });
      const newBid = await entityManager.save(bid);

      // bulkCreate bidPrices
      const bidPricesWithBidId = bidPrices.map((bidPrice) => {
        return { ...bidPrice, bidId: newBid.id, createdByUserId: user.userId }
      })
      const newBidPrices = this.bidPriceRepo.create(bidPricesWithBidId);
      await entityManager.save(newBidPrices);

      // if next to the Step 3
      if (!isDraft) {
        if ('assignedTo' in body && body.assignedTo) {
          const assignedPerson = await this.userRepo.findOne({ 
            userId: body.assignedTo,
            companyId: user.companyId,
            affiliation: user.affiliation,
            userStatus: 'USERVERIFICATION',
            status: 1,  
          })

          if (!assignedPerson) {
            throw new BadRequestException('Assigned person does not exist')
          }

          Object.assign(quotation, { 
            rfqStatus: RfqStatus.NEED_APPROVAL, 
            assignedTo: body.assignedTo,
            updatedByUserId: user.userId 
          })
        } else {
          Object.assign(quotation, { rfqStatus: RfqStatus.SUBMITTED, updatedByUserId: user.userId })
        }

        await entityManager.save(quotation)
      }

      return Object.assign(newBid, { bidPrices: newBidPrices });
    })

  }

  async update(bidId:number, data:UpdateBidDto, currentUser){
    const bid = await this.bidRepo.findOne({ id: bidId, status: 1 }, { select: ['rfqId'] })
    if (!bid) {
      throw new NotFoundException('Bid not found')
    }

    const quotation = await this.quotationRepo.findOne({ id: bid.rfqId, status: 1})
    if (!quotation) {
      throw new NotFoundException('Quotation not found')
    }
    if (quotation.rfqStatus !== RfqStatus.SUBMITTED) {
      throw new BadRequestException('This quotation is not in Bid Submitted');
    }

    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    try {
      const {shippingLine,  vendorName, note, bidPrices} = data

      const deleteBidPrice = await this.bidPriceRepo
      .createQueryBuilder()
      .delete()
      .where("bidId = :bidId", {bidId})
      .execute()

      if(deleteBidPrice){
        const bidPricesWithBidId = _.map(bidPrices, (bidPrice) =>
        Object.assign(bidPrice, {
          bidId,
          createdByUserId: currentUser.userId,
        }),
      );
      const bidPriceEntities = await this.bidPriceRepo.create(bidPricesWithBidId);

      const updateBid = await this.bidRepo
      .createQueryBuilder()
      .update(Bid)
      .set({
        shippingLine,
        vendorName,
        note,
        updatedByUserId: currentUser.userId
      })
      .where('id = :bidId', { bidId })
      .execute()
      await this.queryRunner.manager.save(bidPriceEntities);
      await this.queryRunner.commitTransaction();
      return Object.assign(updateBid, { bidPrices: bidPriceEntities });
      }
      
    } catch (error) {
      await this.queryRunner.rollbackTransaction();
      throw error
    }
  }

  async getTotalPrice(rfqNumber: string) {
    const { finalAmount } = await this.bidRepo
      .createQueryBuilder('b')
      .innerJoin('b.bidprices', 'bp')
      .innerJoin('b.quotation', 'q')
      .where(`
        q.rfqNumber = :rfqNumber
        AND q.status = :status
        AND b.status = :status
        AND bp.status = :status
      `)
      .select(['SUM(bp.total) AS finalAmount'])
      .setParameters({ rfqNumber, status: 1 })
      .getRawOne()
    
    return Math.round(finalAmount)
  }

}
