import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { ROLES_KEYS } from 'src/decorators/roles.decorator'
import { RoleAccess } from '../enums/enum'
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
 
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRole =  this.reflector.getAllAndOverride<RoleAccess[]>(ROLES_KEYS, [
        context.getHandler(),
        context.getClass()
    ])
    if(!requiredRole){
      return true
    }

    const {user} = context.switchToHttp().getRequest();
    let result = requiredRole.includes(user.roleAccess)

    return result


  }
}