export type ImageCallback = (img: HTMLImageElement) => void;

export function setupImageObserver(doc: Document, onImage: ImageCallback): () => void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLImageElement) {
          onImage(node);
        }

        if (node instanceof HTMLElement) {
          for (const img of node.querySelectorAll<HTMLImageElement>('img')) {
            onImage(img);
          }
        }
      }

      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'src' &&
        mutation.target instanceof HTMLImageElement
      ) {
        onImage(mutation.target);
      }
    }
  });

  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
  });

  return () => observer.disconnect();
}
