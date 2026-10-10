import React from 'react';
import { MousePointer2, Shield, Monitor, MousePointerClick, Settings2, Hand, Activity, Smartphone } from 'lucide-react';
import type { HandsfreeSettings, TrackingMode } from '../../types';

interface SettingsViewProps {
  settings: HandsfreeSettings;
  onSettingsChange: (settings: HandsfreeSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsChange,
}) => {
  const update = (partial: Partial<HandsfreeSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
          <p className="text-slate-400">Manage your interaction preferences and input modes.</p>
        </div>

        {/* Tracking Mode */}
        <Section title="Tracking Mode" icon={<Activity className="w-5 h-5 text-violet-400" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['hand', 'head', 'voice', 'combined'] as TrackingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => update({ trackingMode: mode })}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                  settings.trackingMode === mode
                    ? 'bg-violet-600/10 border-violet-500 text-violet-300'
                    : 'bg-surface border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                {mode === 'hand' && <Hand className="w-6 h-6 mb-2" />}
                {mode === 'head' && <Settings2 className="w-6 h-6 mb-2" />}
                {mode === 'voice' && <Activity className="w-6 h-6 mb-2" />}
                {mode === 'combined' && <Smartphone className="w-6 h-6 mb-2" />}
                <span className="text-sm font-medium capitalize">{mode}</span>
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
              <p className="text-white font-medium">Enable Dwell Selection</p>
              <p className="text-slate-400 text-sm mt-1">Hover over a target to select it after a delay.</p>
            </div>
            <ToggleSwitch
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
              <p className="text-white font-medium">Confirm Sensitive Actions</p>
              <p className="text-slate-400 text-sm mt-1">Require voice or dwell confirmation for important actions.</p>
            </div>
            <ToggleSwitch
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
            <span className="text-slate-400 text-sm font-medium">Text Size:</span>
            <div className="flex gap-2 bg-surface p-1 rounded-lg border border-white/5">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => update({ textSize: size })}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    settings.textSize === size
                      ? 'bg-violet-600 text-white shadow-sm'
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

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-background ${
        checked ? 'bg-violet-500' : 'bg-surface border-white/10'
      }`}
      role="switch"
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
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <label className="text-white font-medium text-sm">{label}</label>
        <div className="px-2 py-1 bg-surface rounded-md border border-white/5">
          <span className="text-violet-300 text-sm font-mono">{value}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-background"
      />
      <p className="text-slate-500 text-xs mt-2">{description}</p>
    </div>
  );
}
