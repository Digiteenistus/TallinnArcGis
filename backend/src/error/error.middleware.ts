import { getHttpException } from './http-exception';
import { Request, Response, NextFunction } from 'express';

// noinspection JSUnusedLocalSymbols
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const httpException = getHttpException(error);

  const status = httpException.statusCode || 500;
  const message = httpException.message || 'It\'s not you. It\'s us. We are having some problems.';
  console.error(`ERROR: StatusCode: ${status}`, httpException);
  res.status(status).send({error: message, ...httpException.details});
};
