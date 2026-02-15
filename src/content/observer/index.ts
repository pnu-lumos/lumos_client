export interface ImageObserverHandlers {
  onImageAdded: (img: HTMLImageElement) => void;
  onImageRemoved?: (img: HTMLImageElement) => void;
  onImageSrcChanged?: (img: HTMLImageElement) => void;
}

export function setupImageObserver(doc: Document, handlers: ImageObserverHandlers): () => void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLImageElement) {
          handlers.onImageAdded(node);
        }

        if (node instanceof HTMLElement) {
          for (const img of node.querySelectorAll<HTMLImageElement>('img')) {
            handlers.onImageAdded(img);
          }
        }
      }

      if (handlers.onImageRemoved) {
        for (const node of mutation.removedNodes) {
          if (node instanceof HTMLImageElement) {
            handlers.onImageRemoved(node);
          }

          if (node instanceof HTMLElement) {
            for (const img of node.querySelectorAll<HTMLImageElement>('img')) {
              handlers.onImageRemoved(img);
            }
          }
        }
      }

      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'src' &&
        mutation.target instanceof HTMLImageElement
      ) {
        if (handlers.onImageSrcChanged) {
          handlers.onImageSrcChanged(mutation.target);
        } else {
          handlers.onImageAdded(mutation.target);
        }
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
