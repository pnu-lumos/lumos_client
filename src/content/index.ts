import { createAnnouncer } from './accessibility/announcer';
import { detectCandidateImages, isCandidateImage } from './detector';
import { injectAltText } from './injector';
import { requestImageAnalysis, sendPing } from './messaging';
import { setupImageObserver } from './observer';
import {
  bindImageToUrl,
  getCachedAltText,
  getImageState,
  markAnalyzing,
  markCompleted,
  markError,
  markPending,
  unbindImage
} from './observer/state';
import { getExtensionSettings, onSettingsChanged, type ExtensionSettings } from '../utils/storage';
import { info, warn } from '../utils/logger';

const inFlight = new Set<string>();
const announcer = createAnnouncer(document);
const runtimeSettings: ExtensionSettings = {
  enabled: false,
  autoAnalyze: false
};
let settingsReady = false;

void sendPing().catch((error) => {
  warn('ping failed', error);
});
void initializeSettings();

const unsubscribeSettings = onSettingsChanged((nextSettings) => {
  applyRuntimeSettings(nextSettings);
});

async function analyzeAndInject(img: HTMLImageElement): Promise<void> {
  const imageUrl = resolveImageUrl(img);

  if (
    !canAnalyzeNow() ||
    !imageUrl ||
    inFlight.has(imageUrl) ||
    img.dataset.lumosProcessed === 'true' ||
    !isCandidateImage(img, document)
  ) {
    return;
  }

  inFlight.add(imageUrl);
  // announcer.announce('상품 상세 이미지를 분석 중입니다', {
  //   dedupeKey: 'analysis-started'
  // });
  markAnalyzing(imageUrl, img);

  try {
    const result = await requestImageAnalysis({
      imageUrl,
      pageUrl: window.location.href
    });
    if (!canAnalyzeNow()) {
      return;
    }

    const injection = injectAltText(img, result.altText);
    markCompleted(imageUrl, injection.text, img);

    if (injection.applied) {
      // announcer.announce('이미지 분석이 완료되었습니다', {
      //   dedupeKey: 'analysis-completed'
      // });
    } else {
      info('alt injection skipped', {
        reason: injection.reason,
        imageUrl,
        source: result.source,
        latencyMs: result.latencyMs
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown analyze error';
    markError(imageUrl, message, img);
    warn('analyze request failed', error);
    // announcer.announce('이미지 분석에 실패했습니다', {
    //   dedupeKey: 'analysis-failed'
    // });
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
const disconnectObserver = setupImageObserver(document, {
  onImageAdded: (img) => {
    queueCandidateAnalysis(img);
  },
  onImageRemoved: (img) => {
    unbindImage(img);
  },
  onImageSrcChanged: (img) => {
    unbindImage(img);
    resetImageForSrcChange(img);
    queueCandidateAnalysis(img);
  }
});

window.addEventListener('beforeunload', () => {
  unsubscribeSettings();
  disconnectObserver();
  announcer.destroy();
});

function queueCandidateAnalysis(img: HTMLImageElement): void {
  if (!settingsReady || !canAnalyzeNow()) {
    return;
  }

  const imageUrl = resolveImageUrl(img);
  if (!imageUrl) {
    return;
  }

  const previousUrl = bindImageToUrl(img, imageUrl);
  if (previousUrl && previousUrl !== imageUrl) {
    markPending(imageUrl, img);
  }

  if (!isCandidateImage(img, document)) {
    return;
  }

  const cachedAlt = getCachedAltText(imageUrl);
  if (cachedAlt) {
    const injection = injectAltText(img, cachedAlt);
    if (injection.applied || injection.reason === 'skipped-noop') {
      markCompleted(imageUrl, cachedAlt, img);
      return;
    }
  }

  const state = getImageState(imageUrl);
  if (state?.status === 'analyzing') {
    return;
  }

  if (img.dataset.lumosProcessed === 'true') {
    return;
  }

  if (img.complete) {
    markPending(imageUrl, img);
    void analyzeAndInject(img);
    return;
  }

  if (img.dataset.lumosLoadBound === 'true') {
    return;
  }

  img.dataset.lumosLoadBound = 'true';
  img.addEventListener(
    'load',
    () => {
      queueCandidateAnalysis(img);
    },
    { once: true }
  );
}

function resolveImageUrl(img: HTMLImageElement): string | null {
  const raw = img.currentSrc || img.src;
  if (!raw) {
    return null;
  }

  return raw;
}

function resetImageForSrcChange(img: HTMLImageElement): void {
  const wasInjectedByLumos = img.dataset.lumosInjected === 'true';
  if (wasInjectedByLumos && img.dataset.lumosOriginalAlt !== undefined) {
    img.setAttribute('alt', img.dataset.lumosOriginalAlt);
    img.removeAttribute('aria-label');
  }

  delete img.dataset.lumosProcessed;
  delete img.dataset.lumosInjected;
  delete img.dataset.lumosInjectedAt;
  delete img.dataset.lumosLoadBound;
  delete img.dataset.lumosOriginalAlt;
}

async function initializeSettings(): Promise<void> {
  try {
    const settings = await getExtensionSettings();
    applyRuntimeSettings(settings);
  } catch (error) {
    warn('failed to load extension settings, using defaults', error);
    applyRuntimeSettings({
      enabled: true,
      autoAnalyze: true
    });
  } finally {
    settingsReady = true;
    if (canAnalyzeNow()) {
      scanCurrentImages();
    }
  }
}

function applyRuntimeSettings(settings: ExtensionSettings): void {
  const wasActive = canAnalyzeNow();

  runtimeSettings.enabled = settings.enabled;
  runtimeSettings.autoAnalyze = settings.autoAnalyze;

  if (!wasActive && canAnalyzeNow() && settingsReady) {
    scanCurrentImages();
  }
}

function canAnalyzeNow(): boolean {
  return runtimeSettings.enabled && runtimeSettings.autoAnalyze;
}
