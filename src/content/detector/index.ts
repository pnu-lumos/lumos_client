import { shouldAnalyzeImage } from './filters';
import {
  getDetailRoots,
  isBodyFallbackRoot,
  isInsideDetailRoots,
  queryPlatformImages
} from './selectors';

export function detectCandidateImages(doc: Document): HTMLImageElement[] {
  const roots = getDetailRoots(doc);
  const usesBodyFallback = isBodyFallbackRoot(doc, roots);
  const unique = new Set<HTMLImageElement>();

  for (const root of roots) {
    for (const image of queryPlatformImages(root, doc)) {
      if (shouldAnalyzeImage(image, !usesBodyFallback)) {
        unique.add(image);
      }
    }
  }

  return Array.from(unique).sort(
    (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
  );
}

export function isCandidateImage(img: HTMLImageElement, doc: Document): boolean {
  const roots = getDetailRoots(doc);
  const inside = isInsideDetailRoots(img, doc, roots);
  const usesBodyFallback = isBodyFallbackRoot(doc, roots);

  if (!shouldAnalyzeImage(img, inside && !usesBodyFallback)) {
    return false;
  }

  return inside;
}
