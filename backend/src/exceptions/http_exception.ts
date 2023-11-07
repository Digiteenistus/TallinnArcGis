export default class HttpException extends Error {
  constructor(public statusCode: number, messageOrError: string | Error) {
    super(messageOrError instanceof Error ? messageOrError.message : messageOrError);

    // Without this line, instanceof will not work!
    Object.setPrototypeOf(this, HttpException.prototype);

    if (messageOrError instanceof HttpException) {
      this.statusCode = (messageOrError as HttpException).statusCode;
    }
  }
}

