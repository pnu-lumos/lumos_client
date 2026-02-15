import { createAnnouncer } from './accessibility/announcer';
import { detectCandidateImages, isCandidateImage } from './detector';
import { injectAltText } from './injector';
import { setupImageObserver } from './observer';
import { MESSAGE_TYPES } from '../types';
import type { RuntimeResponseMessage } from '../types';

const inFlight = new Set<string>();
const announcer = createAnnouncer(document);

void chrome.runtime.sendMessage({ type: MESSAGE_TYPES.PING });

async function analyzeAndInject(img: HTMLImageElement): Promise<void> {
  const imageUrl = img.currentSrc || img.src;

  if (
    !imageUrl ||
    inFlight.has(imageUrl) ||
    img.dataset.lumosProcessed === 'true' ||
    !isCandidateImage(img, document)
  ) {
    return;
  }

  inFlight.add(imageUrl);
  announcer.announce('상품 상세 이미지를 분석 중입니다');

  try {
    const response = (await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.ANALYZE_IMAGE,
      payload: {
        imageUrl,
        pageUrl: window.location.href
      }
    })) as RuntimeResponseMessage;

    if (response.success && response.data?.altText) {
      injectAltText(img, response.data.altText);
      announcer.announce('이미지 분석이 완료되었습니다');
    }
  } catch (error) {
    console.warn('[lumos] analyze request failed', error);
    announcer.announce('이미지 분석에 실패했습니다');
  } finally {
    inFlight.delete(imageUrl);
  }
}

function scanCurrentImages(): void {
  const images = detectCandidateImages(document);
  for (const img of images) {
    queueCandidateAnalysis(img);
  }
}

scanCurrentImages();
const disconnectObserver = setupImageObserver(document, (img) => {
  queueCandidateAnalysis(img);
});

window.addEventListener('beforeunload', () => {
  disconnectObserver();
  announcer.destroy();
});

function queueCandidateAnalysis(img: HTMLImageElement): void {
  if (img.dataset.lumosProcessed === 'true') {
    return;
  }

  if (img.complete) {
    if (isCandidateImage(img, document)) {
      void analyzeAndInject(img);
    }
    return;
  }

  if (img.dataset.lumosLoadBound === 'true') {
    return;
  }

  img.dataset.lumosLoadBound = 'true';
  img.addEventListener(
    'load',
    () => {
      if (isCandidateImage(img, document)) {
        void analyzeAndInject(img);
      }
    },
    { once: true }
  );
}
