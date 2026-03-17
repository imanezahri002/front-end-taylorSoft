export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  status?: number;
}

export interface ErrorResponse {
  message: string;
  status: number;
  timestamp: string;
}
