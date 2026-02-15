export const DETAIL_ROOT_SELECTORS = [
  '.se-main-container',
  '#productDetail',
  '[class*="detail"]'
];

export function getDetailRoots(doc: Document): HTMLElement[] {
  const roots = DETAIL_ROOT_SELECTORS.flatMap((selector) =>
    Array.from(doc.querySelectorAll<HTMLElement>(selector))
  );

  if (roots.length > 0) {
    return roots;
  }

  return [doc.body];
}
