import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  userId: number;

  @Expose()
  fullName: string;

  @Expose()
  photo: string;

  @Expose()
  email: string;

  @Expose()
  phoneCode: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  companyName: string;

  @Expose()
  role: string;

  @Expose()
  roleAccess: string;

  @Expose()
  userStatus: string;

  @Expose()
  lastLogin: Date;

  @Expose()
  createdAt: Date;
}