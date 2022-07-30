import { Company } from 'src/companies/entities/company.entity';
import { Invoice } from 'src/invoices/entities/invoice.entity';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { Revenue } from 'src/revenues/entities/revenue.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'c_customers' })
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'company_name',
  })
  companyName: string;

  @Column({
    name: 'full_name',
  })
  fullName: string;

  @Column()
  email: string;

  @Column({
    name: 'phone_code',
  })
  phoneCode: string;

  @Column({
    name: 'phone_number',
  })
  phoneNumber: string;

  @Column({
    name: 'customer_id',
    unique: true,
    nullable: true,
  })
  customerId: string;

  @Column({
    name: 'customer_type',
    nullable: true,
  })
  customerType: string;

  @Column({
    nullable: true,
    width: 20,
  })
  npwp: string;

  @Column({
    nullable: true,
    length: 500,
  })
  address: string;

  @Column({
    name: 'company_id',
  })
  companyId: number;
  
  @Column({
    name: 'affiliation',
    nullable: true
  })
  userAffiliation: string;

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
    name: 'deleted_by_user_id',
    nullable: true,
  })
  deletedByUserId: number;

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

  // Relation
  @OneToMany(() => Quotation, (quotation) => quotation.customer)
  quotations: Quotation[];

  @OneToMany(() => Shipment, (shipment) => shipment.customer)
  shipments: Shipment[];

  @ManyToOne(() => Company, (company) => company.customers)
  @JoinColumn([{ name: 'company_id', referencedColumnName: 'id' }])
  company: Company;

  @OneToMany(() => Revenue, (revenue) => revenue.customer)
  revenues: Revenue[];

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];
}
