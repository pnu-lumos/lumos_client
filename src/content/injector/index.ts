export function injectAltText(img: HTMLImageElement, altText: string): void {
  img.alt = altText;
  img.setAttribute('aria-label', altText);
  img.dataset.lumosProcessed = 'true';
}
