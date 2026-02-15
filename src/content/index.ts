import { createAnnouncer } from './accessibility/announcer';
import { detectCandidateImages, isCandidateImage } from './detector';
import { injectAltText } from './injector';
import { requestImageAnalysis, sendPing } from './messaging';
import { setupImageObserver } from './observer';

const inFlight = new Set<string>();
const announcer = createAnnouncer(document);

void sendPing().catch((error) => {
  console.warn('[lumos] ping failed', error);
});

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
    const result = await requestImageAnalysis({
      imageUrl,
      pageUrl: window.location.href
    });
    const injection = injectAltText(img, result.altText);

    if (injection.applied) {
      announcer.announce('이미지 분석이 완료되었습니다');
    } else {
      console.info('[lumos] alt injection skipped', {
        reason: injection.reason,
        imageUrl,
        source: result.source,
        latencyMs: result.latencyMs
      });
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
