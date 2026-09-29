import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Something went wrong, please try again later';
    const err = exception as any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    } else if (err?.code === 11000) {
      status = HttpStatus.CONFLICT;
      const field = Object.keys(err.keyPattern || {})[0];
      message = field
        ? `${field} already exists`
        : 'Duplicate value, this record already exists';
    } else if (err?.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = Object.values(err.errors || {})
        .map((e: any) => e.message)
        .join(', ');
    } else if (err?.name === 'CastError') {
      // e.g. GET /clinic/not-an-object-id → used to surface as a 500
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid id or parameter';
    } else if (err?.name === 'MulterError') {
      status = err.code === 'LIMIT_FILE_SIZE' ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST;
      message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5MB)' : 'Invalid file upload';
    } else if (err?.type === 'entity.too.large' || err?.status === 413) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'Request body is too large';
    } else {
      // Full details go to the server log only – never to the client.
      this.logger.error(
        err?.message || 'Unhandled exception',
        err?.stack,
      );
    }

    response.status(status).json({
      message,
      success: false,
      data: null,
    });
  }
}
