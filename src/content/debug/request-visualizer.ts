const IS_DEV = import.meta.env.DEV;
const PANEL_ID = 'lumos-debug-api-panel';

const state = {
  totalRequests: 0,
  successRequests: 0,
  failedRequests: 0,
  uniqueUrls: new Set<string>()
};

let panel: HTMLDivElement | null = null;

export function markApiRequested(img: HTMLImageElement, imageUrl: string): void {
  if (!IS_DEV) {
    return;
  }

  state.totalRequests += 1;
  state.uniqueUrls.add(imageUrl);

  img.dataset.lumosDebugApiRequested = 'true';
  img.dataset.lumosDebugApiStatus = 'pending';
  img.dataset.lumosDebugApiRequestIndex = `${state.totalRequests}`;

  // Visual marker for images that triggered an API request.
  img.style.outline = '2px solid #dc2626';
  img.style.outlineOffset = '2px';

  ensurePanel();
  renderPanel();
}

export function markApiSucceeded(img: HTMLImageElement): void {
  if (!IS_DEV) {
    return;
  }

  state.successRequests += 1;
  img.dataset.lumosDebugApiStatus = 'success';

  ensurePanel();
  renderPanel();
}

export function markApiFailed(img: HTMLImageElement): void {
  if (!IS_DEV) {
    return;
  }

  state.failedRequests += 1;
  img.dataset.lumosDebugApiStatus = 'failed';

  // Keep requested border and add a subtle failure cue.
  img.style.boxShadow = 'inset 0 0 0 2px rgba(245, 158, 11, 0.85)';

  ensurePanel();
  renderPanel();
}

function ensurePanel(): void {
  if (!IS_DEV || panel) {
    return;
  }

  panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.position = 'fixed';
  panel.style.right = '12px';
  panel.style.bottom = '12px';
  panel.style.zIndex = '2147483647';
  panel.style.padding = '8px 10px';
  panel.style.borderRadius = '8px';
  panel.style.border = '1px solid rgba(0, 0, 0, 0.18)';
  panel.style.background = 'rgba(255, 255, 255, 0.95)';
  panel.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.16)';
  panel.style.color = '#111827';
  panel.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';
  panel.style.fontSize = '11px';
  panel.style.lineHeight = '1.35';
  panel.style.whiteSpace = 'pre';
  panel.style.pointerEvents = 'none';

  document.body.appendChild(panel);
}

function renderPanel(): void {
  if (!panel) {
    return;
  }

  panel.textContent = [
    'LUMOS DEV',
    `requests: ${state.totalRequests}`,
    `unique:   ${state.uniqueUrls.size}`,
    `success:  ${state.successRequests}`,
    `failed:   ${state.failedRequests}`
  ].join('\n');
}
