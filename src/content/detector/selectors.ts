export type SupportedPlatform = 'naverStore' | 'unknown';

export interface DetectorPlatformRule {
  platform: SupportedPlatform;
  hostMatchers: RegExp[];
  detailRootSelector: string;
  imageSelector: string;
  allowBodyFallback: boolean;
}

const DETECTOR_RULES: DetectorPlatformRule[] = [
  {
    platform: 'naverStore',
    hostMatchers: [/smartstore\.naver\.com$/i, /brand\.naver\.com$/i],
    detailRootSelector: '#INTRODUCE',
    imageSelector: 'img',
    allowBodyFallback: false
  },
  {
    platform: 'unknown',
    hostMatchers: [],
    detailRootSelector: '[class*="detail"]',
    imageSelector: 'img',
    allowBodyFallback: true
  }
];

export function getDetectorRule(hostname: string): DetectorPlatformRule {
  const normalized = hostname.toLowerCase();
  const matched = DETECTOR_RULES.find((rule) =>
    rule.hostMatchers.some((matcher) => matcher.test(normalized))
  );

  return matched ?? DETECTOR_RULES[DETECTOR_RULES.length - 1];
}

export function getDetailRoots(doc: Document): HTMLElement[] {
  const rule = getDetectorRule(doc.location.hostname);
  const roots = Array.from(doc.querySelectorAll<HTMLElement>(rule.detailRootSelector));

  if (roots.length === 0) {
    return rule.allowBodyFallback ? [doc.body] : [];
  }

  return roots.filter((candidate) => !roots.some((other) => other !== candidate && other.contains(candidate)));
}

export function isInsideDetailRoots(
  img: HTMLImageElement,
  doc: Document,
  roots?: HTMLElement[]
): boolean {
  const rule = getDetectorRule(doc.location.hostname);
  if (rule.detailRootSelector.startsWith('#') || rule.detailRootSelector.startsWith('.')) {
    return img.closest(rule.detailRootSelector) !== null;
  }

  const resolvedRoots = roots ?? getDetailRoots(doc);
  return resolvedRoots.some((root) => root === img || root.contains(img));
}

export function queryPlatformImages(root: ParentNode, doc: Document): HTMLImageElement[] {
  const rule = getDetectorRule(doc.location.hostname);
  return Array.from(root.querySelectorAll<HTMLImageElement>(rule.imageSelector));
}
