const EXCLUDE_PATTERNS = [/logo/i, /icon/i, /banner/i, /button/i, /badge/i, /thumbnail/i];
const MEANINGLESS_ALT = [/^\s*$/i, /^image$/i, /^img_?\d+/i, /^detail/i, /^상세/i];

export function shouldAnalyzeImage(img: HTMLImageElement): boolean {
  const src = img.currentSrc || img.src;
  if (!src || EXCLUDE_PATTERNS.some((pattern) => pattern.test(src))) {
    return false;
  }

  if (img.dataset.lumosProcessed === 'true') {
    return false;
  }

  const alt = img.alt?.trim() ?? '';
  const isMeaninglessAlt = MEANINGLESS_ALT.some((pattern) => pattern.test(alt));
  if (!isMeaninglessAlt && alt.length > 0) {
    return false;
  }

  const rect = img.getBoundingClientRect();
  const width = img.naturalWidth || rect.width;
  const height = img.naturalHeight || rect.height;

  if (height < 500 || width < 200) {
    return false;
  }

  const ratio = width / Math.max(height, 1);
  return ratio >= 0.3 && ratio <= 1.5;
}
