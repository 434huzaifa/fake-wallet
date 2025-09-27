export interface ApiResponse<T = unknown> {
  isSuccess: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    isSuccess: true,
    data,
    message,
  };
}

export function createErrorResponse(error: string, message?: string): ApiResponse {
  return {
    isSuccess: false,
    error,
    message,
  };
}

export function handleApiError(error: unknown): ApiResponse {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 'An error occurred while processing your request');
  }
  
  return createErrorResponse('Unknown error occurred', 'An unexpected error occurred');
}