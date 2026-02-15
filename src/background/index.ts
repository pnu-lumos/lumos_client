import { analyzeImage } from '../api/client';
import { MESSAGE_TYPES } from '../types';
import type {
  AnalyzeImageRequestMessage,
  RuntimeRequestMessage,
  RuntimeResponseMessage
} from '../types';

chrome.runtime.onInstalled.addListener(() => {
  console.info('[lumos] background service worker installed');
});

chrome.runtime.onMessage.addListener((
  message: RuntimeRequestMessage,
  _sender,
  sendResponse: (response: RuntimeResponseMessage) => void
) => {
  if (message.type === MESSAGE_TYPES.PING) {
    sendResponse({ success: true, data: { pong: true } });
    return;
  }

  if (message.type === MESSAGE_TYPES.ANALYZE_IMAGE) {
    void handleAnalyzeImage(message, sendResponse);
    return true;
  }

  sendResponse({ success: false, error: 'Unsupported message type' });
});

async function handleAnalyzeImage(
  message: AnalyzeImageRequestMessage,
  sendResponse: (response: RuntimeResponseMessage) => void
): Promise<void> {
  try {
    const result = await analyzeImage({
      imageUrl: message.payload.imageUrl,
      pageUrl: message.payload.pageUrl
    });

    sendResponse({ success: true, data: { altText: result.altText } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown analyze error';
    sendResponse({ success: false, error: errorMessage });
  }
}
