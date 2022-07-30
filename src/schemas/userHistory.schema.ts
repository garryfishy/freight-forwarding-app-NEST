import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserHistoryDocument = UserHistory & Document;

@Schema()
export class UserHistory {
  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  companyName: string;

  @Prop({ type: String })
  lastAccessTime: string;

  @Prop({ type: String })
  loginTime: string
}

export const UserHistorySchema = SchemaFactory.createForClass(UserHistory);