import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

/** Rejects malformed ids with 400 instead of letting Mongoose throw a CastError (500). */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (typeof value !== 'string' || !isValidObjectId(value)) {
      throw new BadRequestException('Invalid id');
    }
    return value;
  }
}
