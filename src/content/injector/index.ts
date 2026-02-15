const MEANINGLESS_ALT_PATTERNS = [
  /^\s*$/i,
  /^image$/i,
  /^img_?\d+/i,
  /^detail/i,
  /^상세/i,
  /^상품 이미지$/i
];

export type InjectResultReason =
  | 'applied'
  | 'skipped-empty-text'
  | 'skipped-disconnected'
  | 'skipped-meaningful-alt'
  | 'skipped-noop';

export interface InjectResult {
  applied: boolean;
  reason: InjectResultReason;
  text: string;
}

export function injectAltText(img: HTMLImageElement, rawAltText: string): InjectResult {
  const altText = normalizeAltText(rawAltText);
  if (!altText) {
    return {
      applied: false,
      reason: 'skipped-empty-text',
      text: ''
    };
  }

  if (!img.isConnected) {
    return {
      applied: false,
      reason: 'skipped-disconnected',
      text: altText
    };
  }

  const currentAlt = img.alt?.trim() ?? '';
  const hasMeaningfulAlt = currentAlt.length > 0 && !isMeaninglessAlt(currentAlt);
  const alreadyInjectedByLumos = img.dataset.lumosInjected === 'true';

  if (hasMeaningfulAlt && !alreadyInjectedByLumos) {
    return {
      applied: false,
      reason: 'skipped-meaningful-alt',
      text: altText
    };
  }

  if (currentAlt === altText && img.getAttribute('aria-label') === altText) {
    markProcessed(img);
    return {
      applied: false,
      reason: 'skipped-noop',
      text: altText
    };
  }

  preserveOriginalAlt(img);
  img.setAttribute('alt', altText);
  img.setAttribute('aria-label', altText);
  markProcessed(img);

  return {
    applied: true,
    reason: 'applied',
    text: altText
  };
}

function normalizeAltText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function isMeaninglessAlt(alt: string): boolean {
  return MEANINGLESS_ALT_PATTERNS.some((pattern) => pattern.test(alt));
}

function preserveOriginalAlt(img: HTMLImageElement): void {
  if (img.dataset.lumosOriginalAlt !== undefined) {
    return;
  }

  if (img.hasAttribute('alt')) {
    img.dataset.lumosOriginalAlt = img.getAttribute('alt') ?? '';
  } else {
    img.dataset.lumosOriginalAlt = '';
  }
}

function markProcessed(img: HTMLImageElement): void {
  img.dataset.lumosProcessed = 'true';
  img.dataset.lumosInjected = 'true';
  img.dataset.lumosInjectedAt = `${Date.now()}`;
}
