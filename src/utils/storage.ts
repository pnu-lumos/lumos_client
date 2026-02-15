export interface ExtensionSettings {
  enabled: boolean;
  autoAnalyze: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  autoAnalyze: true
};

export function getSyncStorage<T extends object>(
  keys: string[] | string | object | null
): Promise<T> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (items) => {
      resolve(items as T);
    });
  });
}

export function setSyncStorage(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(items, () => {
      resolve();
    });
  });
}
