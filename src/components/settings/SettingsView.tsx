import React from 'react';
import { MousePointer2, Shield, Monitor, MousePointerClick, Hand, Activity, ScanFace, Mic, Layers, Sun, Moon } from 'lucide-react';
import type { HandsfreeSettings, TrackingMode } from '../../types';

interface SettingsViewProps {
  settings: HandsfreeSettings;
  isTracking: boolean;
  onSettingsChange: (settings: HandsfreeSettings) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  isTracking,
  onSettingsChange,
  theme,
  onThemeToggle,
}) => {
  const update = (partial: Partial<HandsfreeSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8" data-handsfree-scroll-container>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-primary mb-2">Settings</h2>
          <p className="text-slate-400">Manage your interaction preferences and input modes.</p>
        </div>

        {/* Theme */}
        <Section title="Appearance" icon={<Monitor className="w-5 h-5 text-slate-400" />}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-primary font-medium">Theme</p>
              <p className="text-secondary text-sm mt-1">Your choice is saved on this device. New visitors inherit their system preference.</p>
            </div>
            <button
              type="button"
              onClick={onThemeToggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </Section>

        {/* Tracking Mode */}
        <Section title="Tracking Mode" icon={<Activity className="w-5 h-5 text-slate-400" />}>
          <p className="text-secondary text-sm mb-4">
            {isTracking ? 'Stop the active session before changing modes.' : 'Choose how this session controls the interface. Combined tracking is coming soon.'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['hand', 'head', 'voice', 'combined'] as TrackingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => update({ trackingMode: mode })}
                disabled={mode === 'combined' || isTracking}
                aria-pressed={settings.trackingMode === mode}
                title={mode === 'combined' ? 'Combined tracking is coming soon' : isTracking ? 'Stop the active session to change modes' : undefined}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                  settings.trackingMode === mode
                    ? 'bg-slate-600/10 border-slate-500 text-primary'
                    : 'bg-surface border-white/5 text-secondary hover:bg-white/5 hover:border-white/10'
                } ${mode === 'combined' || isTracking ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {mode === 'hand' && <Hand className="w-6 h-6 mb-2" />}
                {mode === 'head' && <ScanFace className="w-6 h-6 mb-2" />}
                {mode === 'voice' && <Mic className="w-6 h-6 mb-2" />}
                {mode === 'combined' && <Layers className="w-6 h-6 mb-2" />}
                <span className="text-sm font-medium capitalize">{mode}</span>
                {mode === 'combined' && <span className="text-[10px] mt-1">Coming soon</span>}
              </button>
            ))}
          </div>
        </Section>

        {/* Sensitivity & Smoothing */}
        <Section title="Pointer Control" icon={<MousePointer2 className="w-5 h-5 text-blue-400" />}>
          <div className="space-y-6">
            <SliderSetting
              label="Sensitivity"
              value={settings.sensitivity}
              min={1}
              max={10}
              onChange={(v) => update({ sensitivity: v })}
              description="Higher = more cursor movement per head/hand motion."
            />
            <SliderSetting
              label="Smoothing"
              value={settings.smoothing}
              min={1}
              max={10}
              onChange={(v) => update({ smoothing: v })}
              description="Higher = smoother but slower cursor movement."
            />
            <SliderSetting
              label="Dead Zone"
              value={settings.deadZone}
              min={0}
              max={20}
              onChange={(v) => update({ deadZone: v })}
              description="Minimum movement (px) before cursor responds."
            />
          </div>
        </Section>

        {/* Scrolling Settings */}
        <Section title="Hand Scrolling" icon={<MousePointer2 className="w-5 h-5 text-amber-400" />}>
          <div className="space-y-6">
            <SliderSetting
              label="Scroll Sensitivity"
              value={settings.scrollSensitivity}
              min={1}
              max={10}
              onChange={(v) => update({ scrollSensitivity: v })}
              description="Multiplier for hand scrolling speed."
            />
            <SliderSetting
              label="Scroll Dead Zone"
              value={settings.scrollDeadZone}
              min={0}
              max={40}
              onChange={(v) => update({ scrollDeadZone: v })}
              description="Minimum movement before scrolling starts."
            />
          </div>
        </Section>

        {/* Dwell Selection */}
        <Section title="Dwell Selection" icon={<MousePointerClick className="w-5 h-5 text-green-400" />}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-primary font-medium">Enable Dwell Selection</p>
              <p className="text-slate-400 text-sm mt-1">Hover over a target to select it after a delay.</p>
            </div>
            <ToggleSwitch
              label="Enable Dwell Selection"
              checked={settings.dwellEnabled}
              onChange={() => update({ dwellEnabled: !settings.dwellEnabled })}
            />
          </div>
          {settings.dwellEnabled && (
            <div className="pt-4 border-t border-white/5">
              <SliderSetting
                label="Dwell Time"
                value={settings.dwellTime}
                min={500}
                max={3000}
                step={100}
                onChange={(v) => update({ dwellTime: v })}
                description={`Wait ${settings.dwellTime}ms before clicking.`}
              />
            </div>
          )}
        </Section>

        {/* Safety */}
        <Section title="Safety & IntentGuard" icon={<Shield className="w-5 h-5 text-rose-400" />}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-primary font-medium">Confirm Sensitive Actions</p>
              <p className="text-slate-400 text-sm mt-1">Require voice or dwell confirmation for important actions.</p>
            </div>
            <ToggleSwitch
              label="Confirm Sensitive Actions"
              checked={settings.confirmSensitiveActions}
              onChange={() => update({ confirmSensitiveActions: !settings.confirmSensitiveActions })}
            />
          </div>
          <div className="pt-4 border-t border-white/5">
            <SliderSetting
              label="Activation Cooldown"
              value={settings.activationCooldown}
              min={100}
              max={2000}
              step={100}
              onChange={(v) => update({ activationCooldown: v })}
              description={`Wait ${settings.activationCooldown}ms between activations.`}
            />
          </div>
        </Section>

        {/* Text Size */}
        <Section title="Display" icon={<Monitor className="w-5 h-5 text-cyan-400" />}>
          <div className="flex items-center gap-4">
            <span className="text-secondary text-sm font-medium">Text Size:</span>
            <div className="flex gap-2 bg-surface p-1 rounded-lg border border-white/5">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => update({ textSize: size })}
                  aria-pressed={settings.textSize === size}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    settings.textSize === size
                      ? 'bg-slate-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

// ---- Helpers ----

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-surface rounded-lg border border-white/5">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-background ${
        checked ? 'bg-slate-500' : 'bg-surface border-white/10'
      }`}
      role="switch"
      aria-label={label}
      aria-checked={checked}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function SliderSetting({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  description,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  description: string;
}) {
  const inputId = `setting-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <label htmlFor={inputId} className="text-primary font-medium text-sm">{label}</label>
        <div className="px-2 py-1 bg-surface rounded-md border border-white/5">
          <span className="text-slate-300 text-sm font-mono">{value}</span>
        </div>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-slate-500 [&::-webkit-slider-thumb]:rounded-full focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-background"
      />
      <p className="text-slate-500 text-xs mt-2">{description}</p>
    </div>
  );
}
