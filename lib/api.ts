export interface ApiSuccess<T> {
  status: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiError {
  status: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  data?: Record<string, string[]>;
}

export type ApiErrorData = Record<string, string[]>;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public detail?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function unwrapApi<T>(
  res: { data: ApiSuccess<T> | ApiError },
): T {
  const body = res.data;

  if (!body.status) {
    throw new ApiRequestError(
      body.message,
      body.statusCode,
      body.data,
    );
  }

  return body.data;
}