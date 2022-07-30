import { Quotation } from 'src/quotations/entities/quotation.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BidPrice } from './bid-price.entity';

@Entity({ name: 't_bids' })
export class Bid {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'shipping_line',
  })
  shippingLine: string;

  @Column({
    name: 'rfq_id',
  })
  rfqId: number;

  @Column({
    name: 'vendor_name',
  })
  vendorName: string;

  @Column({
    nullable: true,
    length: 500,
  })
  note: string;

  @Column({
    default: 1,
  })
  status: number;

  @Column({
    name: 'created_by_user_id',
    nullable: true,
  })
  createdByUserId: number;

  @Column({
    name: 'updated_by_user_id',
    nullable: true,
  })
  updatedByUserId: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    onUpdate: 'CURRENT_TIMESTAMP',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relation
  @OneToOne(() => Quotation, (quotation) => quotation.bid)
  @JoinColumn([{ name: 'rfq_id', referencedColumnName: 'id' }])
  quotation: Quotation;

  @OneToMany(() => BidPrice, (bidprice) => bidprice.bid)
  bidprices: BidPrice[];
}
