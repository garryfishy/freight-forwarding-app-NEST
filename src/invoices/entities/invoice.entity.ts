import { Customer } from 'src/customers/entities/customer.entity';
import { InvoiceStatus } from 'src/enums/enum';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { ManyToOne, BeforeInsert, Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToMany, OneToOne } from 'typeorm'

@Entity({ name: 't_invoices' })
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'invoice_number',
    unique: true,
  })
  invoiceNumber: string;

  @Column({
    name: 'rfq_number',
    unique: true,
  })
  rfqNumber: string;

  @Column({
    name: 'order_number',
    unique: true,
  })
  orderNumber: string;

  @Column({
    name: 'customer_id',
  })
  customerId: string;

  // issued

  @Column({
    name: 'due_date',
    nullable: true,
  })
  dueDate: string;

  @Column({
    name: 'sub_total',
    type: 'decimal',
    precision: 16,
    scale: 2,
    nullable: true,
  })
  subTotal: number;

  @Column({
    name: 'materai',
    type: 'decimal',
    precision: 16,
    scale: 2,
    nullable: true,
  })
  materai: number;

  @Column({
    name: 'advance',
    type: 'decimal',
    precision: 16,
    scale: 2,
    nullable: true,
  })
  advance: number;

  // hasil Math.round()
  @Column({
    nullable: true,
  })
  total: number;

  @Column({
    name: 'issued_date',
    nullable: true,
  })
  issuedDate: string;

  @Column({
    name: 'issued_by',
    nullable: true,
  })
  issuedBy: number;

  // settled

  @Column({
    name: 'settled_date',
    nullable: true,
  })
  settledDate: string;

  @Column({
    name: 'settled_by',
    nullable: true,
  })
  settledBy: number;

  @Column({
    nullable: true,
  })
  bank: string;

  @Column({
    name: 'bank_holder',
    nullable: true,
  })
  bankHolder: string;

  @Column({
    name: 'settled_amount',
    nullable: true,
  })
  settledAmount: string;

  @Column({
    name: 'payment_date',
    nullable: true,
  })
  paymentDate: string;

  @Column({
    name: 'invoice_status',
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  invoiceStatus: string;

  // file
  @Column({
    name: 'file_container',
    nullable: true,
  })
  fileContainer: string;

  @Column({
    name: 'file_name',
    nullable: true,
  })
  fileName: string;

  @Column({
    name: 'original_name',
    nullable: true,
  })
  originalName: string;

  @Column({
    nullable: true,
  })
  url: string;
  // general

  @Column({
    default: 1,
  })
  status: number;

  @Column({
    name: 'created_by_company_id',
  })
  createdByCompanyId: number;

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

  // Relations

  @ManyToOne(() => Customer, (customer) => customer.invoices)
  @JoinColumn([{ name: 'customer_id', referencedColumnName: 'customerId' }])
  customer: Customer;

  @OneToOne(() => Shipment)
  @JoinColumn([{ name: 'order_number', referencedColumnName: 'orderNumber' }])
  shipment: Shipment;

  @OneToOne(() => Quotation)
  @JoinColumn([{ name: 'rfq_number', referencedColumnName: 'rfqNumber' }])
  quotation: Quotation;

  //Hooks
  
  @BeforeInsert()
  async defaultZero() {
    this.advance = 0
    this.materai = 0
  }
}