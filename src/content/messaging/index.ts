import { MESSAGE_TYPES } from '../../types';
import type {
  AnalyzeImageRequestMessage,
  AnalyzeImageResponseMessage,
  RuntimeErrorResponse,
  RuntimeResponseMessage
} from '../../types';

export async function sendPing(): Promise<void> {
  const message = {
    type: MESSAGE_TYPES.PING,
    requestId: createRequestId(),
    payload: {}
  };

  const response = (await chrome.runtime.sendMessage(message)) as RuntimeResponseMessage;
  if (!response.success) {
    throw createRuntimeError(response);
  }
}

export async function requestImageAnalysis(input: {
  imageUrl: string;
  pageUrl: string;
}): Promise<AnalyzeImageResponseMessage['data']> {
  const message: AnalyzeImageRequestMessage = {
    type: MESSAGE_TYPES.ANALYZE_IMAGE,
    requestId: createRequestId(),
    payload: {
      imageUrl: input.imageUrl,
      pageUrl: input.pageUrl
    }
  };

  const response = (await chrome.runtime.sendMessage(message)) as RuntimeResponseMessage;

  if (response.success) {
    if (response.type !== MESSAGE_TYPES.ANALYZE_IMAGE) {
      throw new Error(`Unexpected response type: ${response.type}`);
    }
    return response.data;
  }

  throw createRuntimeError(response);
}

function createRuntimeError(response: RuntimeErrorResponse): Error {
  const error = new Error(`[${response.error.code}] ${response.error.message}`);
  error.name = response.error.retryable ? 'RetryableRuntimeError' : 'RuntimeError';
  return error;
}

function createRequestId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
