import { Shipment } from 'src/shipments/entities/shipment.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 't_shipment_files' })
export class ShipmentFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'order_number',
  })
  orderNumber: string;

  @Column({
    name: 'file_container',
  })
  fileContainer: string;

  @Column({
    name: 'file_name',
  })
  fileName: string;
  
  @Column({
    name: 'original_name',
  })
  originalName: string;

  @Column()
  url: string;

  @Column({
    name: 'created_by_user_id',
  })
  createdByUserId: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // Relation
  @ManyToOne(() => Shipment, (shipment) => shipment.shipmentFiles)
  @JoinColumn({ name: 'order_number', referencedColumnName: 'orderNumber' })
  shipment: Shipment;

}
