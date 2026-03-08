import {
  getExtensionSettings,
  isValidApiBaseUrl,
  normalizeApiBaseUrl,
  onSettingsChanged,
  setExtensionSettings,
  type ExtensionSettings
} from '../utils/storage';
import { warn } from '../utils/logger';

const enabledInput = requireElement<HTMLInputElement>('#enabled');
const autoAnalyzeInput = requireElement<HTMLInputElement>('#autoAnalyze');
const apiBaseUrlInput = requireElement<HTMLInputElement>('#apiBaseUrl');
const status = requireElement<HTMLElement>('#status');

void loadSettings();
const unsubscribe = onSettingsChanged((settings) => {
  applySettings(settings);
});
window.addEventListener('beforeunload', () => {
  unsubscribe();
});

enabledInput.addEventListener('change', () => {
  void saveSettings();
});

autoAnalyzeInput.addEventListener('change', () => {
  void saveSettings();
});

apiBaseUrlInput.addEventListener('change', () => {
  void saveSettings();
});

apiBaseUrlInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  void saveSettings();
});

async function loadSettings(): Promise<void> {
  try {
    const settings = await getExtensionSettings();
    applySettings(settings);
  } catch (error) {
    status.textContent = '설정을 불러오지 못했습니다.';
    warn('failed to load options settings', error);
  }
}

async function saveSettings(): Promise<void> {
  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrlInput.value);
  if (normalizedApiBaseUrl.length > 0 && !isValidApiBaseUrl(normalizedApiBaseUrl)) {
    status.textContent = 'API Base URL은 http:// 또는 https:// 주소여야 합니다.';
    apiBaseUrlInput.focus();
    return;
  }

  try {
    await setExtensionSettings({
      enabled: enabledInput.checked,
      autoAnalyze: autoAnalyzeInput.checked,
      apiBaseUrl: normalizedApiBaseUrl
    });

    apiBaseUrlInput.value = normalizedApiBaseUrl;
    status.textContent = '설정이 저장되었습니다.';
    window.setTimeout(() => {
      status.textContent = '';
    }, 1200);
  } catch (error) {
    status.textContent = '설정 저장에 실패했습니다.';
    warn('failed to save options settings', error);
  }
}

function applySettings(settings: ExtensionSettings): void {
  enabledInput.checked = settings.enabled;
  autoAnalyzeInput.checked = settings.autoAnalyze;
  apiBaseUrlInput.value = settings.apiBaseUrl;
  autoAnalyzeInput.disabled = !settings.enabled;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Options UI element not found: ${selector}`);
  }
  return element;
}
