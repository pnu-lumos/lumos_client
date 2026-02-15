const EXCLUDE_PATTERNS = [
  /logo/i,
  /icon/i,
  /banner/i,
  /button/i,
  /badge/i,
  /thumbnail/i,
  /sprite/i
];
const MEANINGLESS_ALT = [
  /^\s*$/i,
  /^image$/i,
  /^img_?\d+/i,
  /^detail/i,
  /^상세/i,
  /^상품 이미지$/i
];

const FILTER = {
  minWidth: 200,
  minHeight: 500,
  minArea: 100_000,
  minAspectRatio: 0.3,
  maxAspectRatio: 1.5
} as const;

export function shouldAnalyzeImage(img: HTMLImageElement): boolean {
  if (img.dataset.lumosProcessed === 'true') {
    return false;
  }

  const src = img.currentSrc || img.src;
  if (!isValidImageUrl(src)) {
    return false;
  }

  const alt = img.alt?.trim() ?? '';
  if (alt.length > 0 && !isMeaninglessAlt(alt)) {
    return false;
  }

  if (!hasRenderableBox(img)) {
    return false;
  }

  const size = getImageSize(img);
  if (size.width < FILTER.minWidth || size.height < FILTER.minHeight) {
    return false;
  }

  const area = size.width * size.height;
  if (area < FILTER.minArea) {
    return false;
  }

  const ratio = size.width / Math.max(size.height, 1);
  return ratio >= FILTER.minAspectRatio && ratio <= FILTER.maxAspectRatio;
}

function isValidImageUrl(src: string): boolean {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return false;
  }

  return !EXCLUDE_PATTERNS.some((pattern) => pattern.test(src));
}

function isMeaninglessAlt(alt: string): boolean {
  return MEANINGLESS_ALT.some((pattern) => pattern.test(alt));
}

function hasRenderableBox(img: HTMLImageElement): boolean {
  if (img.getClientRects().length === 0) {
    return false;
  }

  return img.getBoundingClientRect().width > 0 && img.getBoundingClientRect().height > 0;
}

function getImageSize(img: HTMLImageElement): { width: number; height: number } {
  const rect = img.getBoundingClientRect();
  return {
    width: img.naturalWidth || rect.width,
    height: img.naturalHeight || rect.height
  };
}
