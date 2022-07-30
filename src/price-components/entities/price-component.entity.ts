import { BidPrice } from 'src/bids/entities/bid-price.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'm_price_components' })
export class PriceComponent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({
    default: 1,
  })
  status: number;

  @Column({
    name: 'created_by_user_id',
    nullable: true,
  })
  createdBy: number;

  @Column({
    name: 'updated_by_user_id',
    nullable: true,
  })
  updatedBy: number;

  @Column({
    name: 'deleted_by_user_id',
    nullable: true,
  })
  deletedBy: number;

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

  @Column({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
  })
  deletedAt: Date;

  // Relations
  @OneToMany(() => BidPrice, (bidprice) => bidprice.priceComp)
  bidprices: BidPrice[];
}
