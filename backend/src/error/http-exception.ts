import { HttpStatusCodes } from "./http_status_codes";
import {MongoServerError} from 'mongodb';

export function getHttpException(err: any): HttpException {
  if (err instanceof HttpException) {
    return err;
  }

  if (err instanceof MongoServerError) {
    let msg = 'Database error';
    let code = err.code;
    let details = {};
    let statusCode = HttpStatusCodes.InternalServerError;

    if (err.code == 11000) {
      console.log('conflict catched', err);
      let dupKey = '';
      let dupValue = '';
      Object.keys(err.keyValue).forEach(key => {
        dupKey = key;
        dupValue = err.keyValue[key];
      });
      details = {dup_key: dupKey, dup_value: dupValue};
      msg = `${dupKey} '${dupValue}' already exists`;
      statusCode = HttpStatusCodes.Conflict;
    }

    return new HttpException(statusCode, msg, {
      code, ...details
    });
  }

  if (err instanceof SyntaxError) {
    console.log('syntax error', err);
    return new HttpException(HttpStatusCodes.BadRequest, err.message);
  }

  console.error('unexpected exception', err);
  return new HttpException(HttpStatusCodes.InternalServerError, "Server crashed :(");
}

export default class HttpException extends Error {
  public details: any;

  constructor(public statusCode: number, messageOrError: string | Error | any, details?: any) {
    super(messageOrError instanceof Error ? messageOrError.message : messageOrError);

    // Without this line, instanceof will not work!
    Object.setPrototypeOf(this, HttpException.prototype);

    if (messageOrError instanceof HttpException) {
      this.statusCode = (messageOrError as HttpException).statusCode;
    }
    
    this.details = details;
  }
}

