import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'm_ports' })
export class Port {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'port_name',
  })
  portName: string;

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
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
  })
  deletedAt: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    onUpdate: 'CURRENT_TIMESTAMP',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
