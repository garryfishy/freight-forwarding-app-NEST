import { Company } from 'src/companies/entities/company.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BeforeInsert, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { Menu } from 'src/access-role/entities/menu';
import { Role, RoleAccess } from 'src/enums/enum'
@Entity({ name: 'c_users' })
export class User {
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  userId: number;

  @Column({
    name: 'company_id',
  })
  companyId: number;

  @Column({
    name: 'full_name',
  })
  fullName: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column({
    nullable: true,
  })
  password: string;

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
    type:'enum', 
    enum: Role,
  })
  role: string;

  @Column({
    name: 'role_access', 
    type:'enum', 
    enum: RoleAccess,
    nullable: true
  })
  roleAccess: string;

  @Column({
    name: 'file_container',
    nullable: true,
  })
  fileContainer: string;

  @Column({
    nullable: true,
  })
  photo: string;

  @Column({
    nullable: true,
  })
  affiliation: string;

  @Column({
    name: 'division_name',
    nullable: true,
  })
  divisionName: string;

  @Column({
    name: 'last_login',
    nullable: true,
    type: 'datetime',
  })
  lastLogin: Date;

  @Column({
    name: 'user_status',
    default: 'OPEN',
  })
  userStatus: string;

  @Column({
    name: 'created_by',
    nullable: true,
  })
  createdBy: string;

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

  @ManyToOne(() => Company, (company) => company.users)
  @JoinColumn([{ name: 'company_id', referencedColumnName: 'id' }])
  company: Company;

  @ManyToMany(() => Menu)
  @JoinTable({
    name: 'm_access_menu_users',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'userId',
    },
    inverseJoinColumn: {
      name: 'menu_id',
      referencedColumnName: 'id',
    },
  })
  menus: Menu[];

  // Hooks
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hashSync(this.password, 10);
  }
}
