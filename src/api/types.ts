export interface AnalyzeImageRequest {
  imageUrl: string;
  pageUrl?: string;
}

export interface AnalyzeImageResponse {
  altText: string;
  source: 'mock' | 'api';
}

export interface AnalyzeImageOptions {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export type ApiErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';

export class ApiClientError extends Error {
  code: ApiErrorCode;
  retryable: boolean;

  constructor(message: string, code: ApiErrorCode, retryable: boolean) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.retryable = retryable;
  }
}
