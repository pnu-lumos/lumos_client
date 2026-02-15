export interface ExtensionSettings {
  enabled: boolean;
  autoAnalyze: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  autoAnalyze: true
};

export type SettingsChangeListener = (
  settings: ExtensionSettings,
  changedKeys: Array<keyof ExtensionSettings>
) => void;

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

export async function getExtensionSettings(): Promise<ExtensionSettings> {
  const stored = await getSyncStorage<Partial<ExtensionSettings>>({
    enabled: DEFAULT_SETTINGS.enabled,
    autoAnalyze: DEFAULT_SETTINGS.autoAnalyze
  });

  return normalizeSettings(stored);
}

export async function setExtensionSettings(settings: ExtensionSettings): Promise<void> {
  await setSyncStorage({
    enabled: settings.enabled,
    autoAnalyze: settings.autoAnalyze
  });
}

export function onSettingsChanged(listener: SettingsChangeListener): () => void {
  const handleStorageChange = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ): void => {
    if (areaName !== 'sync') {
      return;
    }

    const changedKeys = (['enabled', 'autoAnalyze'] as const).filter(
      (key) => changes[key] !== undefined
    );
    if (changedKeys.length === 0) {
      return;
    }

    const partial: Partial<ExtensionSettings> = {};
    for (const key of changedKeys) {
      partial[key] = changes[key].newValue as ExtensionSettings[typeof key];
    }

    listener(normalizeSettings(partial), [...changedKeys]);
  };

  chrome.storage.onChanged.addListener(handleStorageChange);
  return () => {
    chrome.storage.onChanged.removeListener(handleStorageChange);
  };
}

function normalizeSettings(partial: Partial<ExtensionSettings>): ExtensionSettings {
  return {
    enabled:
      typeof partial.enabled === 'boolean' ? partial.enabled : DEFAULT_SETTINGS.enabled,
    autoAnalyze:
      typeof partial.autoAnalyze === 'boolean'
        ? partial.autoAnalyze
        : DEFAULT_SETTINGS.autoAnalyze
  };
}
