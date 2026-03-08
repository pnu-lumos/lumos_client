import { warn } from './logger';

export interface ExtensionSettings {
  enabled: boolean;
  autoAnalyze: boolean;
  apiBaseUrl: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  autoAnalyze: true,
  apiBaseUrl: ''
};

export type SettingsChangeListener = (
  settings: ExtensionSettings,
  changedKeys: Array<keyof ExtensionSettings>
) => void | Promise<void>;

export function getSyncStorage<T extends object>(
  keys: string[] | string | object | null
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (items) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(items as T);
    });
  });
}

export function setSyncStorage(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(items, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

export async function getExtensionSettings(): Promise<ExtensionSettings> {
  const stored = await getSyncStorage<Partial<ExtensionSettings>>({
    enabled: DEFAULT_SETTINGS.enabled,
    autoAnalyze: DEFAULT_SETTINGS.autoAnalyze,
    apiBaseUrl: DEFAULT_SETTINGS.apiBaseUrl
  });

  return normalizeSettings(stored);
}

export async function setExtensionSettings(settings: ExtensionSettings): Promise<void> {
  await setSyncStorage({
    enabled: settings.enabled,
    autoAnalyze: settings.autoAnalyze,
    apiBaseUrl: normalizeApiBaseUrl(settings.apiBaseUrl)
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

    const changedKeys = (['enabled', 'autoAnalyze', 'apiBaseUrl'] as const).filter(
      (key) => changes[key] !== undefined
    );
    if (changedKeys.length === 0) {
      return;
    }

    void getExtensionSettings()
      .then((settings) => listener(settings, [...changedKeys]))
      .catch((error) => {
        warn('failed to refresh settings after storage change', error);
      });
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
        : DEFAULT_SETTINGS.autoAnalyze,
    apiBaseUrl:
      typeof partial.apiBaseUrl === 'string'
        ? normalizeApiBaseUrl(partial.apiBaseUrl)
        : DEFAULT_SETTINGS.apiBaseUrl
  };
}

export function normalizeApiBaseUrl(value: string | null | undefined): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.replace(/\/+$/, '');
}

export function isValidApiBaseUrl(value: string): boolean {
  if (value.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_error) {
    return false;
  }
}
