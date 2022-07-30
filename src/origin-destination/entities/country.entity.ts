import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'm_countries' })
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'country_name',
  })
  countryName: string;

  @Column({
    name: 'country_code',
  })
  countryCode: string;

  @Column({
    name: 'created_by_user_id',
    nullable: true,
  })
  createdBy: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
