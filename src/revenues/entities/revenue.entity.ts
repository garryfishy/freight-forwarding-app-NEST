import { Customer } from 'src/customers/entities/customer.entity';
import { OtifStatus, RevenueKind, ShipmentService } from 'src/enums/enum';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 't_revenues' })
export class Revenue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'customer_id'
  })
  customerId: string;

  @Column({
    name: 'order_number',
  })
  orderNumber: string; 

  @Column({
    name: 'otif_status',
    type: 'enum',
    enum: OtifStatus,
  })
  otifStatus: OtifStatus;

  @Column({
    length: 4,
  })
  year: string;

  @Column({
    length: 2,
  })
  month: string;

  @Column({
    name: 'initial_amount',
    type: 'decimal',
    precision: 16,
    scale: 2,
  })
  initialAmount: number;

  @Column({
    name: 'final_amount',
    type: 'decimal',
    precision: 16,
    scale: 2,
  })
  finalAmount: number;

  // finalAmount - initialAmount (if kind === adjustment)
  @Column({
    name: 'adjustment_amount',
    type: 'decimal',
    precision: 16,
    scale: 2,
  })
  adjustmentAmount: number;

  // percentage number of the current progression (if kind === progression)
  @Column({
    name: 'progression_percentage',
    type: 'tinyint',
    width: 3,
  })
  progressionPercentage: number;
  
  // cummulative progression percentage
  @Column({
    type: 'tinyint',
    width: 3,
  })
  progress: number

  // finalAmount * progressionPercentage (finalAmount === initialAmount)
  @Column({
    name: 'progression_amount',
    type: 'decimal',
    precision: 16,
    scale: 2,
  })
  progressionAmount: number;
 
  // cumulative revenue
  @Column({
    type: 'decimal',
    precision: 16,
    scale: 2,
  })
  settled: number;

  // cumulative remaining amount (not revenue yet)
  @Column({
    type: 'decimal',
    precision: 16,
    scale: 2,
  })
  remaining: number;
  
  // progression or adjustment
  @Column({
    type: 'enum',
    enum: RevenueKind,
  })
  kind: RevenueKind; 

  @Column({
    name: 'shipment_service',
    type: 'enum',
    enum: ShipmentService,
  })
  shipmentService: ShipmentService;
  
  @Column({
    name: 'rfq_number',
  })
  rfqNumber: string;

  @Column()
  affiliation: string;

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

  // Relations
  @ManyToOne(() => Shipment, (shipment) => shipment.revenues)
  @JoinColumn([{ name: 'order_number', referencedColumnName: 'orderNumber' }])
  shipment: Shipment;

  @ManyToOne(() => Customer, (customer) => customer.revenues)
  @JoinColumn([{ name: 'customer_id', referencedColumnName: 'customerId' }])
  customer: Customer;
}
