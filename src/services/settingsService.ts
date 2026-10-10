import type { HandsfreeSettings } from '../types';

const STORAGE_KEY = 'handsfree_settings';

export const DEFAULT_SETTINGS: HandsfreeSettings = {
  trackingMode: 'hand',
  sensitivity: 5,
  smoothing: 5,
  dwellTime: 1200,
  dwellEnabled: true,
  deadZone: 5,
  textSize: 'medium',
  confirmSensitiveActions: true,
  activationCooldown: 500,
  scrollSensitivity: 5,
  scrollDeadZone: 15,
};

export function loadSettings(): HandsfreeSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      if (settings.trackingMode === 'combined') settings.trackingMode = 'hand';
      return settings;
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: HandsfreeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage', e);
  }
}
