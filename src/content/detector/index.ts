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

  return Array.from(unique);
}
