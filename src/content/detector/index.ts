import { shouldAnalyzeImage } from './filters';
import { getDetailRoots } from './selectors';

export function detectCandidateImages(doc: Document): HTMLImageElement[] {
  const roots = getDetailRoots(doc);
  const unique = new Set<HTMLImageElement>();

  for (const root of roots) {
    for (const image of root.querySelectorAll<HTMLImageElement>('img')) {
      if (shouldAnalyzeImage(image)) {
        unique.add(image);
      }
    }
  }

  return Array.from(unique).sort(
    (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
  );
}

export function isCandidateImage(img: HTMLImageElement, doc: Document): boolean {
  if (!shouldAnalyzeImage(img)) {
    return false;
  }

  const roots = getDetailRoots(doc);
  return roots.some((root) => root === img || root.contains(img));
}
