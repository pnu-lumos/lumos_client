import { analyzeImageMock } from './mock';
import {
  ApiClientError,
  type AnalyzeImageOptions,
  type AnalyzeImageRequest,
  type AnalyzeImageResponse
} from './types';

const USE_MOCK = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_LUMOS_API_BASE_URL;
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 400;

export async function analyzeImage(
  request: AnalyzeImageRequest,
  options: AnalyzeImageOptions = {}
): Promise<AnalyzeImageResponse> {
  if (USE_MOCK || !API_BASE_URL) {
    return analyzeImageMock(request);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  let lastError: ApiClientError | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image_url: request.imageUrl, page_url: request.pageUrl })
        },
        timeoutMs
      );

      if (!response.ok) {
        const isServerError = response.status >= 500;
        throw new ApiClientError(
          `Analyze API failed with status ${response.status}`,
          'SERVER_ERROR',
          isServerError
        );
      }

      const payload = (await response.json()) as { alt?: string };
      if (!payload.alt || typeof payload.alt !== 'string') {
        throw new ApiClientError('Analyze API returned empty alt text', 'UNKNOWN_ERROR', false);
      }

      return {
        altText: payload.alt,
        source: 'api'
      };
    } catch (error) {
      const normalized = normalizeApiError(error);
      lastError = normalized;

      if (!normalized.retryable || attempt === maxRetries) {
        break;
      }

      await sleep(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError ?? new ApiClientError('Analyze API failed', 'UNKNOWN_ERROR', false);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError(`Analyze API timed out after ${timeoutMs}ms`, 'TIMEOUT', true);
    }
    throw new ApiClientError('Network request failed', 'NETWORK_ERROR', true);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message, 'UNKNOWN_ERROR', false);
  }

  return new ApiClientError('Unknown analyze error', 'UNKNOWN_ERROR', false);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}
