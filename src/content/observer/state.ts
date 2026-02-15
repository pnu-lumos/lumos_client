export type ImageStatus = 'pending' | 'analyzing' | 'completed' | 'error';

export interface ImageState {
  url: string;
  status: ImageStatus;
  altText?: string;
  updatedAt: number;
  lastError?: string;
  elementRef?: WeakRef<HTMLImageElement>;
}

const imageStateMap = new Map<string, ImageState>();
const elementToUrl = new WeakMap<HTMLImageElement, string>();

export function getImageState(url: string): ImageState | undefined {
  return imageStateMap.get(url);
}

export function getCachedAltText(url: string): string | undefined {
  const state = imageStateMap.get(url);
  if (!state || state.status !== 'completed') {
    return undefined;
  }

  return state.altText;
}

export function markPending(url: string, img?: HTMLImageElement): ImageState {
  return upsertState(url, {
    status: 'pending',
    elementRef: toWeakRef(img),
    lastError: undefined
  });
}

export function markAnalyzing(url: string, img?: HTMLImageElement): ImageState {
  return upsertState(url, {
    status: 'analyzing',
    elementRef: toWeakRef(img),
    lastError: undefined
  });
}

export function markCompleted(url: string, altText: string, img?: HTMLImageElement): ImageState {
  return upsertState(url, {
    status: 'completed',
    altText,
    elementRef: toWeakRef(img),
    lastError: undefined
  });
}

export function markError(url: string, errorMessage: string, img?: HTMLImageElement): ImageState {
  return upsertState(url, {
    status: 'error',
    elementRef: toWeakRef(img),
    lastError: errorMessage
  });
}

export function bindImageToUrl(img: HTMLImageElement, url: string): string | undefined {
  const previousUrl = elementToUrl.get(img);
  elementToUrl.set(img, url);
  bindElementRef(url, img);
  return previousUrl;
}

export function unbindImage(img: HTMLImageElement): string | undefined {
  const url = elementToUrl.get(img);
  if (!url) {
    return undefined;
  }

  elementToUrl.delete(img);
  clearElementRef(url, img);
  return url;
}

function upsertState(url: string, patch: Partial<ImageState>): ImageState {
  const existing = imageStateMap.get(url);
  const next: ImageState = {
    url,
    status: patch.status ?? existing?.status ?? 'pending',
    altText: patch.altText ?? existing?.altText,
    updatedAt: Date.now(),
    lastError: patch.lastError ?? existing?.lastError,
    elementRef: patch.elementRef ?? existing?.elementRef
  };

  imageStateMap.set(url, next);
  return next;
}

function bindElementRef(url: string, img: HTMLImageElement): void {
  const existing = imageStateMap.get(url);
  if (!existing) {
    return;
  }

  imageStateMap.set(url, {
    ...existing,
    elementRef: new WeakRef(img),
    updatedAt: Date.now()
  });
}

function clearElementRef(url: string, img: HTMLImageElement): void {
  const existing = imageStateMap.get(url);
  if (!existing || !existing.elementRef) {
    return;
  }

  const currentElement = existing.elementRef.deref();
  if (currentElement !== img) {
    return;
  }

  imageStateMap.set(url, {
    ...existing,
    elementRef: undefined,
    updatedAt: Date.now()
  });
}

function toWeakRef(img?: HTMLImageElement): WeakRef<HTMLImageElement> | undefined {
  return img ? new WeakRef(img) : undefined;
}
