export interface Announcer {
  announce: (message: string) => void;
  destroy: () => void;
}

export function createAnnouncer(doc: Document): Announcer {
  const region = doc.createElement('div');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.style.position = 'absolute';
  region.style.width = '1px';
  region.style.height = '1px';
  region.style.overflow = 'hidden';
  region.style.clip = 'rect(0 0 0 0)';

  doc.body.appendChild(region);

  return {
    announce(message: string) {
      region.textContent = '';
      window.setTimeout(() => {
        region.textContent = message;
      }, 50);
    },
    destroy() {
      region.remove();
    }
  };
}
