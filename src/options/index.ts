import {
  getExtensionSettings,
  onSettingsChanged,
  setExtensionSettings,
  type ExtensionSettings
} from '../utils/storage';

const enabledInput = requireElement<HTMLInputElement>('#enabled');
const autoAnalyzeInput = requireElement<HTMLInputElement>('#autoAnalyze');
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

async function loadSettings(): Promise<void> {
  const settings = await getExtensionSettings();
  applySettings(settings);
}

async function saveSettings(): Promise<void> {
  await setExtensionSettings({
    enabled: enabledInput.checked,
    autoAnalyze: autoAnalyzeInput.checked
  });

  status.textContent = '설정이 저장되었습니다.';
  window.setTimeout(() => {
    status.textContent = '';
  }, 1200);
}

function applySettings(settings: ExtensionSettings): void {
  enabledInput.checked = settings.enabled;
  autoAnalyzeInput.checked = settings.autoAnalyze;
  autoAnalyzeInput.disabled = !settings.enabled;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Options UI element not found: ${selector}`);
  }
  return element;
}
