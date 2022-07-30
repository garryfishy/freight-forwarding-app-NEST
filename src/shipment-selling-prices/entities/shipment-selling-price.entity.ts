import { Shipment } from 'src/shipments/entities/shipment.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 't_shipment_selling_prices' })
export class ShipmentSelllingPrice {
  @PrimaryGeneratedColumn()
  id: number;

  // @Column({
  //   name: 'order_number',
  // })
  // orderNumber: string;

  @Column({
    name: 'price_component'
  })
  priceComponent: string;

  @Column()
  uom: string;

  @Column({
    type: 'decimal',
    precision: 16,
    scale: 2,
  })
  price: number;

  @Column()
  qty: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  vat: number;

  @Column({
    type: 'decimal',
    precision: 16,
    scale: 2,
  })
  total: number;

  @Column({
    default: 1,
  })
  status: number;

  @Column({
    name: 'created_by_user_id',
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

  //Relations

  @ManyToOne(() => Shipment, (ship) => ship.orderNumber)
  @JoinColumn([{ name: 'order_number', referencedColumnName: 'orderNumber' }])
  orderNumber: string;


}
