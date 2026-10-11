import React, { useState } from 'react';
import { Play, Square, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw, BarChart3, Activity, Clock, Target, AlertTriangle } from 'lucide-react';
import type { EvaluationSession, EvaluationTrial, EvaluationInputMode } from '../../types';
import {
  EVALUATION_TASKS,
  loadSessions,
  saveSessions,
  createSession,
  createTrial,
  avgCompletionTime,
  voiceAccuracy,
  totalErrors,
  totalAccidentalActivations,
  successRate,
} from '../../services/evaluationService';

export const EvaluationView: React.FC = () => {
  const [sessions, setSessions] = useState<EvaluationSession[]>(() => loadSessions());
  const [activeSession, setActiveSession] = useState<EvaluationSession | null>(null);
  const [activeTrial, setActiveTrial] = useState<EvaluationTrial | null>(null);
  const [selectedMode, setSelectedMode] = useState<EvaluationInputMode>('handsfree');

  const allTrials = sessions.flatMap((s) => s.trials);
  const handsfreeTrials = allTrials.filter((t) => t.inputMode === 'handsfree');
  const conventionalTrials = allTrials.filter((t) => t.inputMode === 'conventional');

  const startSession = () => {
    const session = createSession();
    setActiveSession(session);
  };

  const startTrial = (taskId: string) => {
    if (!activeSession) return;
    const trial = createTrial(taskId, selectedMode);
    setActiveTrial(trial);
  };

  const completeTrial = (success: boolean) => {
    if (!activeTrial || !activeSession) return;
    const completed: EvaluationTrial = {
      ...activeTrial,
      endTime: Date.now(),
      completed: true,
      success,
    };
    const updatedSession: EvaluationSession = {
      ...activeSession,
      trials: [...activeSession.trials, completed],
    };
    setActiveSession(updatedSession);
    setActiveTrial(null);
  };

  const recordError = () => {
    if (!activeTrial) return;
    setActiveTrial({ ...activeTrial, errors: activeTrial.errors + 1 });
  };

  const recordAccidental = () => {
    if (!activeTrial) return;
    setActiveTrial({
      ...activeTrial,
      accidentalActivations: activeTrial.accidentalActivations + 1,
    });
  };

  const endSession = () => {
    if (!activeSession) return;
    const ended: EvaluationSession = { ...activeSession, endTime: Date.now() };
    const updated = [...sessions, ended];
    setSessions(updated);
    saveSessions(updated);
    setActiveSession(null);
    setActiveTrial(null);
  };

  const clearAllData = () => {
    setSessions([]);
    saveSessions([]);
    setActiveSession(null);
    setActiveTrial(null);
  };

  const formatTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercent = (v: number | null) => {
    if (v === null) return 'N/A';
    return `${(v * 100).toFixed(1)}%`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8" data-handsfree-scroll-container>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Usability Testing</h2>
            <p className="text-slate-400">Evaluate input methods across standardized interaction tasks.</p>
          </div>
          <div className="flex items-center gap-3">
            {!activeSession ? (
              <button
                onClick={startSession}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <Play className="w-4 h-4" />
                New Session
              </button>
            ) : (
              <button
                onClick={endSession}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600/10 text-rose-400 hover:bg-rose-600/20 border border-rose-500/20 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <Square className="w-4 h-4" />
                End Session
              </button>
            )}
            {sessions.length > 0 && (
              <button
                onClick={clearAllData}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-white/5 text-slate-300 border border-white/5 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <Trash2 className="w-4 h-4" />
                Clear Data
              </button>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200/80 text-sm">
            Prototype evaluations. Metrics are calculated from recorded trials only and do not represent clinical validation.
          </p>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Total Trials"
            value={allTrials.length.toString()}
            icon={<Target className="w-5 h-5 text-blue-400" />}
          />
          <MetricCard
            title="Avg Completion (HF)"
            value={formatTime(avgCompletionTime(handsfreeTrials))}
            icon={<Clock className="w-5 h-5 text-slate-400" />}
          />
          <MetricCard
            title="Success Rate (HF)"
            value={formatPercent(successRate(handsfreeTrials))}
            icon={<Activity className="w-5 h-5 text-emerald-400" />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Active Session & Trial Controls */}
          <div className="xl:col-span-1 space-y-8">
            {activeSession ? (
              <div className="bg-card border border-slate-500/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 to-slate-400" />
                <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-400" />
                  Active Session
                </h3>

                {/* Mode Selection */}
                <div className="flex bg-surface p-1 rounded-lg border border-white/5 mb-6">
                  <button
                    onClick={() => setSelectedMode('conventional')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      selectedMode === 'conventional'
                        ? 'bg-slate-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Conventional
                  </button>
                  <button
                    onClick={() => setSelectedMode('handsfree')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      selectedMode === 'handsfree'
                        ? 'bg-stone-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    HandsFree
                  </button>
                </div>

                {activeTrial ? (
                  <div className="bg-surface border border-white/5 rounded-xl p-5 space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recording</span>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      </div>
                      <h4 className="text-white font-medium mb-1">
                        {EVALUATION_TASKS.find((t) => t.id === activeTrial.taskId)?.name}
                      </h4>
                      <p className="text-slate-400 text-sm">
                        {EVALUATION_TASKS.find((t) => t.id === activeTrial.taskId)?.description}
                      </p>
                    </div>

                    <div className="flex gap-4 p-3 bg-background rounded-lg border border-white/5">
                      <div className="flex-1 text-center">
                        <span className="block text-2xl font-mono text-white mb-1">{activeTrial.errors}</span>
                        <span className="text-xs text-slate-400 uppercase">Errors</span>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div className="flex-1 text-center">
                        <span className="block text-2xl font-mono text-white mb-1">{activeTrial.accidentalActivations}</span>
                        <span className="text-xs text-slate-400 uppercase">Accidental</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={recordError}
                        className="flex flex-col items-center justify-center p-3 bg-surface hover:bg-white/5 border border-white/5 rounded-lg text-slate-300 transition-colors"
                      >
                        <XCircle className="w-5 h-5 mb-1 text-rose-400" />
                        <span className="text-xs font-medium">Add Error</span>
                      </button>
                      <button
                        onClick={recordAccidental}
                        className="flex flex-col items-center justify-center p-3 bg-surface hover:bg-white/5 border border-white/5 rounded-lg text-slate-300 transition-colors"
                      >
                        <AlertCircle className="w-5 h-5 mb-1 text-amber-400" />
                        <span className="text-xs font-medium">Add Accidental</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => completeTrial(true)}
                        className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Success
                      </button>
                      <button
                        onClick={() => completeTrial(false)}
                        className="flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-medium transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Fail
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-400 text-sm font-medium">Select task to begin:</p>
                    <div className="space-y-2">
                      {EVALUATION_TASKS.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => startTrial(task.id)}
                          className="w-full text-left bg-surface hover:bg-white/5 border border-white/5 rounded-xl p-4 transition-all group"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-white font-medium text-sm group-hover:text-slate-300 transition-colors">{task.name}</span>
                            <Play className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                          </div>
                          <p className="text-slate-500 text-xs">{task.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Active Session</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-[240px]">Start a new session to record metrics for different input modalities.</p>
                <button
                  onClick={startSession}
                  className="px-6 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium text-sm transition-all"
                >
                  Start Session
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Dashboards & History */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Metrics Comparison</h3>
              </div>

              {allTrials.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-xl border border-white/5">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No trial data available yet.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="overflow-hidden rounded-xl border border-white/5">
                    <table className="w-full text-sm">
                      <thead className="bg-surface">
                        <tr>
                          <th className="text-left font-medium text-slate-400 py-3 px-4">Metric</th>
                          <th className="text-right font-medium text-blue-400 py-3 px-4">Conventional</th>
                          <th className="text-right font-medium text-slate-400 py-3 px-4">HandsFree</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-card">
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 text-slate-300">Avg Completion Time</td>
                          <td className="text-right py-3 px-4 font-mono text-slate-200">{formatTime(avgCompletionTime(conventionalTrials))}</td>
                          <td className="text-right py-3 px-4 font-mono text-slate-200">{formatTime(avgCompletionTime(handsfreeTrials))}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 text-slate-300">Voice Accuracy</td>
                          <td className="text-right py-3 px-4 font-mono text-slate-200">{formatPercent(voiceAccuracy(conventionalTrials))}</td>
                          <td className="text-right py-3 px-4 font-mono text-slate-200">{formatPercent(voiceAccuracy(handsfreeTrials))}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 text-slate-300">Selection Errors</td>
                          <td className="text-right py-3 px-4 font-mono text-slate-200">{totalErrors(conventionalTrials)}</td>
                          <td className="text-right py-3 px-4 font-mono text-slate-200">{totalErrors(handsfreeTrials)}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 text-slate-300">Accidental Activations</td>
                          <td className="text-right py-3 px-4 font-mono text-slate-200">{totalAccidentalActivations(conventionalTrials)}</td>
                          <td className="text-right py-3 px-4 font-mono text-slate-200">{totalAccidentalActivations(handsfreeTrials)}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-200">Success Rate</td>
                          <td className="text-right py-3 px-4 font-mono text-blue-300 font-medium">{formatPercent(successRate(conventionalTrials))}</td>
                          <td className="text-right py-3 px-4 font-mono text-slate-300 font-medium">{formatPercent(successRate(handsfreeTrials))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-5">
                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Success Rate Visualized</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-blue-400 font-medium">Conventional</span>
                          <span className="text-white font-mono">{formatPercent(successRate(conventionalTrials))}</span>
                        </div>
                        <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(successRate(conventionalTrials) ?? 0) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-400 font-medium">HandsFree</span>
                          <span className="text-white font-mono">{formatPercent(successRate(handsfreeTrials))}</span>
                        </div>
                        <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-slate-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(successRate(handsfreeTrials) ?? 0) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trial History */}
            {allTrials.length > 0 && (
              <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-white">Recent Trials</h3>
                  </div>
                  <span className="text-xs bg-surface text-slate-400 px-2.5 py-1 rounded-md border border-white/5">
                    {allTrials.length} Total
                  </span>
                </div>
                
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {allTrials
                    .slice()
                    .reverse()
                    .map((trial) => {
                      const task = EVALUATION_TASKS.find((t) => t.id === trial.taskId);
                      return (
                        <div
                          key={trial.id}
                          className="flex items-center justify-between px-4 py-3 bg-surface border border-white/5 rounded-xl text-sm hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {trial.success ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            <span className="text-white font-medium">{task?.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                trial.inputMode === 'handsfree'
                                  ? 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                                  : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                              }`}
                            >
                              {trial.inputMode}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            {(trial.errors > 0 || trial.accidentalActivations > 0) && (
                              <div className="flex gap-2">
                                {trial.errors > 0 && <span className="text-xs text-rose-400/80">{trial.errors} err</span>}
                                {trial.accidentalActivations > 0 && <span className="text-xs text-amber-400/80">{trial.accidentalActivations} acc</span>}
                              </div>
                            )}
                            <span className="text-slate-500 font-mono text-xs">
                              {trial.endTime
                                ? `${((trial.endTime - trial.startTime) / 1000).toFixed(1)}s`
                                : '...'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for top metrics
function MetricCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-white/5 rounded-xl p-5 flex items-center gap-4">
      <div className="p-3 bg-surface rounded-lg border border-white/5">
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-semibold text-white font-mono">{value}</p>
      </div>
    </div>
  );
}
