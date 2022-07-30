import { SetMetadata } from "@nestjs/common";
import { RoleAccess } from '../enums/enum'

export const ROLES_KEYS = 'roles'
export const Roles = (...roles: RoleAccess[]) => SetMetadata(ROLES_KEYS, roles)
