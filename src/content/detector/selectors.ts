export type SupportedPlatform = 'naverStore' | 'unknown';

const PLATFORM_DETAIL_SELECTORS: Record<SupportedPlatform, string[]> = {
  naverStore: [
    '#INTRODUCE',
    '#DETAIL',
    '#productDetail',
    '.se-main-container',
    '[class*="detail"]'
  ],
  unknown: ['[class*="detail"]']
};

export function resolvePlatform(hostname: string): SupportedPlatform {
  if (hostname.endsWith('smartstore.naver.com') || hostname.endsWith('brand.naver.com')) {
    return 'naverStore';
  }

  return 'unknown';
}

export function getDetailRootSelectors(hostname: string): string[] {
  const platform = resolvePlatform(hostname);
  return PLATFORM_DETAIL_SELECTORS[platform];
}

export function getDetailRoots(doc: Document): HTMLElement[] {
  const selectors = getDetailRootSelectors(doc.location.hostname);
  const candidates = selectors.flatMap((selector) =>
    Array.from(doc.querySelectorAll<HTMLElement>(selector))
  );

  if (candidates.length === 0) {
    return [doc.body];
  }

  return candidates.filter(
    (candidate) =>
      !candidates.some((other) => other !== candidate && other.contains(candidate))
  );
}
