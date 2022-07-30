import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CannotCreateEntityIdMapError, EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';


@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let message = (exception as any).message.message;
    let code = 'Internal Server Error';

    Logger.error(message, (exception as any).stack, `${request.method} ${request.url}`);

    let status = HttpStatus.INTERNAL_SERVER_ERROR

    if (exception instanceof HttpException) {
      status = (exception as HttpException).getStatus();
      message = (exception as any).message;
      code = (exception as any).code;

    } else if (exception instanceof TypeORMError) {
      switch (exception.constructor) {
        case EntityNotFoundError:
          status = HttpStatus.NOT_FOUND
          message = `${(exception as EntityNotFoundError).message.split(':')[0].split('"')[1]} not found`;
          code = 'Not Found';
          break;
        case QueryFailedError:
          status = HttpStatus.UNPROCESSABLE_ENTITY
          message = (exception as QueryFailedError).message;
          code = (exception as any).code;
          break;
        // case CannotCreateEntityIdMapError:
        //   status = HttpStatus.UNPROCESSABLE_ENTITY
        //   message = (exception as CannotCreateEntityIdMapError).message;
        //   code = (exception as any).code;
        //   break;
      }
    }

    response.status(status).json({ statusCode: status, message, error: code });
  }
}
