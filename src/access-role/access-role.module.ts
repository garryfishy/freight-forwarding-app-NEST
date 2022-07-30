import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRoleController } from './access-role.controller';
import { AccessRoleService } from './access-role.service';

@Module({
  controllers: [AccessRoleController],
  providers: [AccessRoleService],
  imports:[
    TypeOrmModule.forFeature([]),
  ],
})
export class AccessRoleModule {}
