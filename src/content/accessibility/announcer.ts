export interface Announcer {
  announce: (message: string, options?: AnnounceOptions) => void;
  destroy: () => void;
}

export interface AnnounceOptions {
  dedupeKey?: string;
  force?: boolean;
  dedupeWindowMs?: number;
}

interface QueueItem {
  message: string;
  key: string;
  dedupeWindowMs: number;
}

const DEFAULT_DEDUPE_WINDOW_MS = 1200;
const MIN_ANNOUNCE_INTERVAL_MS = 700;
const MESSAGE_SWAP_DELAY_MS = 50;

export function createAnnouncer(doc: Document): Announcer {
  const region = doc.createElement('div');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.setAttribute('role', 'status');
  region.style.position = 'absolute';
  region.style.width = '1px';
  region.style.height = '1px';
  region.style.overflow = 'hidden';
  region.style.clip = 'rect(0 0 0 0)';
  region.style.clipPath = 'inset(50%)';
  region.style.whiteSpace = 'nowrap';

  doc.body.appendChild(region);

  const queue: QueueItem[] = [];
  const lastAnnouncedAt = new Map<string, number>();
  let processing = false;
  let destroyed = false;
  let intervalTimer: number | null = null;
  let swapTimer: number | null = null;

  return {
    announce(message: string, options: AnnounceOptions = {}) {
      if (destroyed) {
        return;
      }

      const normalized = normalizeMessage(message);
      if (!normalized) {
        return;
      }

      const key = options.dedupeKey ?? normalized;
      const dedupeWindowMs = options.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;
      if (!options.force && isDuplicate(key, dedupeWindowMs, lastAnnouncedAt, queue)) {
        return;
      }

      queue.push({ message: normalized, key, dedupeWindowMs });
      processQueue();
    },
    destroy() {
      destroyed = true;
      queue.length = 0;
      if (intervalTimer !== null) {
        globalThis.clearTimeout(intervalTimer);
      }
      if (swapTimer !== null) {
        globalThis.clearTimeout(swapTimer);
      }
      region.remove();
    }
  };

  function processQueue(): void {
    if (processing || destroyed) {
      return;
    }

    const next = queue.shift();
    if (!next) {
      return;
    }

    processing = true;
    region.textContent = '';
    swapTimer = globalThis.setTimeout(() => {
      region.textContent = next.message;
      lastAnnouncedAt.set(next.key, Date.now());
      intervalTimer = globalThis.setTimeout(() => {
        processing = false;
        processQueue();
      }, MIN_ANNOUNCE_INTERVAL_MS);
    }, MESSAGE_SWAP_DELAY_MS);
  }
}

function normalizeMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim();
}

function isDuplicate(
  key: string,
  dedupeWindowMs: number,
  lastAnnouncedAt: Map<string, number>,
  queue: QueueItem[]
): boolean {
  if (queue.some((item) => item.key === key)) {
    return true;
  }

  const lastAt = lastAnnouncedAt.get(key);
  if (lastAt === undefined) {
    return false;
  }

  return Date.now() - lastAt < dedupeWindowMs;
}
