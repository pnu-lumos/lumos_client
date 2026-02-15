import { analyzeImage } from '../api/client';
import { ApiClientError } from '../api/types';
import { MESSAGE_TYPES, type MessageType } from '../types';
import { info } from '../utils/logger';
import type {
  AnalyzeImageRequestMessage,
  PingRequestMessage,
  RuntimeRequestMessage,
  RuntimeErrorCode,
  RuntimeErrorResponse,
  RuntimeResponseMessage
} from '../types';

chrome.runtime.onInstalled.addListener(() => {
  info('background service worker installed');
});

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender,
    sendResponse: (response: RuntimeResponseMessage) => void
  ): boolean | void => {
    if (!isRuntimeRequestMessage(message)) {
      sendResponse(createErrorResponse(MESSAGE_TYPES.PING, 'unknown', 'INVALID_MESSAGE', false));
      return;
    }

    if (message.type === MESSAGE_TYPES.PING) {
      handlePing(message, sendResponse);
      return;
    }

    if (message.type === MESSAGE_TYPES.ANALYZE_IMAGE) {
      if (!isValidAnalyzePayload(message)) {
        sendResponse(
          createErrorResponse(
            message.type,
            message.requestId,
            'INVALID_PAYLOAD',
            false,
            'imageUrl/pageUrl payload is invalid'
          )
        );
        return;
      }

      void handleAnalyzeImage(message, sendResponse);
      return true;
    }

    sendResponse(
      createErrorResponse(
        MESSAGE_TYPES.PING,
        'unknown',
        'INVALID_MESSAGE',
        false,
        'Unsupported message type'
      )
    );
  }
);

async function handleAnalyzeImage(
  message: AnalyzeImageRequestMessage,
  sendResponse: (response: RuntimeResponseMessage) => void
): Promise<void> {
  const start = Date.now();
  try {
    const result = await analyzeImage(
      {
        imageUrl: message.payload.imageUrl,
        pageUrl: message.payload.pageUrl
      },
      {
        timeoutMs: 12_000,
        maxRetries: 2,
        retryDelayMs: 400
      }
    );

    sendResponse({
      success: true,
      type: message.type,
      requestId: message.requestId,
      data: {
        altText: result.altText,
        source: result.source,
        latencyMs: Date.now() - start
      }
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      sendResponse(
        createErrorResponse(
          message.type,
          message.requestId,
          mapApiErrorCode(error.code),
          error.retryable,
          error.message
        )
      );
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown analyze error';
    sendResponse(
      createErrorResponse(message.type, message.requestId, 'UNKNOWN_ERROR', false, errorMessage)
    );
  }
}

function handlePing(
  message: PingRequestMessage,
  sendResponse: (response: RuntimeResponseMessage) => void
): void {
  sendResponse({
    success: true,
    type: message.type,
    requestId: message.requestId,
    data: { pong: true }
  });
}

function isRuntimeRequestMessage(message: unknown): message is RuntimeRequestMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<RuntimeRequestMessage>;
  if (typeof candidate.requestId !== 'string' || candidate.requestId.length === 0) {
    return false;
  }

  return candidate.type === MESSAGE_TYPES.PING || candidate.type === MESSAGE_TYPES.ANALYZE_IMAGE;
}

function isValidAnalyzePayload(message: AnalyzeImageRequestMessage): boolean {
  const { imageUrl, pageUrl } = message.payload;
  if (typeof imageUrl !== 'string' || typeof pageUrl !== 'string') {
    return false;
  }

  return isHttpUrl(imageUrl) && isHttpUrl(pageUrl);
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_error) {
    return false;
  }
}

function mapApiErrorCode(code: ApiClientError['code']): RuntimeErrorCode {
  if (code === 'NETWORK_ERROR') {
    return 'NETWORK_ERROR';
  }

  if (code === 'TIMEOUT') {
    return 'TIMEOUT';
  }

  if (code === 'SERVER_ERROR') {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

function createErrorResponse(
  type: MessageType,
  requestId: string,
  code: RuntimeErrorCode,
  retryable: boolean,
  message?: string
): RuntimeErrorResponse {
  return {
    success: false,
    type,
    requestId,
    error: {
      code,
      message: message ?? code,
      retryable
    }
  };
}
