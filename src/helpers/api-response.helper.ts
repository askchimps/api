export class ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
  statusCode: number;

  constructor(
    success: boolean,
    message: string,
    data: T | null,
    error: string | null,
    statusCode: number,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.statusCode = statusCode;
  }

  static success<T>(
    message: string,
    data: T,
    statusCode = 200,
  ): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data, null, statusCode);
  }

  static error(
    message: string,
    error: any,
    statusCode = 400,
  ): ApiResponse<null> {
    return new ApiResponse<null>(
      false,
      message,
      null,
      error instanceof Error ? error.message : String(error),
      statusCode,
    );
  }
}
