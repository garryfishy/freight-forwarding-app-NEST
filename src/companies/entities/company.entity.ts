import { User } from 'src/users/entities/user.entity';
import { PaymentAdvice } from 'src/payment-advices/entities/payment-advice.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinTable, ManyToMany } from 'typeorm'
import { Customer } from 'src/customers/entities/customer.entity';
import { Menu } from 'src/access-role/entities/menu';

@Entity({ name: 'c_companies' })
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  name: string;

  @Column({
    nullable: true,
    length: 500,
  })
  address: string;

  @Column({
    unique: true,
    nullable: true,
  })
  email: string;

  @Column({
    name: 'phone_code',
    nullable: true,
  })
  phoneCode: string;

  @Column({
    name: 'phone_number',
    nullable: true,
  })
  phoneNumber: string;

  @Column({
    nullable: true,
    width: 20,
  })
  npwp: string;

  @Column({
    name: 'file_container',
    nullable: true,
  })
  fileContainer: string;

  @Column({
    nullable: true,
  })
  logo: string;

  @Column({
    name: 'theme_color',
    nullable: true,
  })
  themeColor: string;

  @Column({
    name: 'quotation_notes',
    type: 'text',
    nullable: true,
    default: null
  })
  quotationNotes: string;

  @Column({
    nullable: true
  })
  affiliation: string;

  @Column({
    nullable: true
  })
  subdomain: string;

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

  // Relations                                  
  @OneToMany(() => User, (user) => user.company)
  users: User[];
  
  @OneToMany(() => PaymentAdvice, (paymentAdvice) => paymentAdvice.company)
  paymentAdvices: PaymentAdvice[];

  @OneToMany(() => Customer, (customer) => customer.companyId)
  customers: Customer[];

  @ManyToMany(() => Menu)
  @JoinTable({
    name: "m_access_menu_companies",
    joinColumn: {
      name: "company_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "menu_id",
      referencedColumnName: "id"
    },
  })
  menus: Menu[];
}
