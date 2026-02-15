import {
  DEFAULT_SETTINGS,
  getSyncStorage,
  setSyncStorage,
  type ExtensionSettings
} from '../utils/storage';

const enabledInput = requireElement<HTMLInputElement>('#enabled');
const autoAnalyzeInput = requireElement<HTMLInputElement>('#autoAnalyze');
const status = requireElement<HTMLElement>('#status');

void loadSettings();

enabledInput.addEventListener('change', () => {
  void saveSettings();
});

autoAnalyzeInput.addEventListener('change', () => {
  void saveSettings();
});

async function loadSettings(): Promise<void> {
  const stored = await getSyncStorage<Partial<ExtensionSettings>>({
    enabled: DEFAULT_SETTINGS.enabled,
    autoAnalyze: DEFAULT_SETTINGS.autoAnalyze
  });
  const settings: ExtensionSettings = {
    enabled: stored.enabled ?? DEFAULT_SETTINGS.enabled,
    autoAnalyze: stored.autoAnalyze ?? DEFAULT_SETTINGS.autoAnalyze
  };

  enabledInput.checked = settings.enabled;
  autoAnalyzeInput.checked = settings.autoAnalyze;
}

async function saveSettings(): Promise<void> {
  await setSyncStorage({
    enabled: enabledInput.checked,
    autoAnalyze: autoAnalyzeInput.checked
  });

  status.textContent = '설정이 저장되었습니다.';
  window.setTimeout(() => {
    status.textContent = '';
  }, 1200);
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Options UI element not found: ${selector}`);
  }
  return element;
}
