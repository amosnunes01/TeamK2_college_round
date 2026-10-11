import type { EvaluationSession, EvaluationTask, EvaluationTrial } from '../types';

const SESSIONS_KEY = 'handsfree_eval_sessions';

export const EVALUATION_TASKS: EvaluationTask[] = [
  {
    id: 'nav-about',
    name: 'Navigate to About',
    description: 'Navigate to the About page using the sidebar or links.',
    type: 'navigate',
    expectedOutcome: 'About page is displayed.',
  },
  {
    id: 'scroll-section',
    name: 'Scroll to Section',
    description: 'Scroll down to the "Features" section on the home page.',
    type: 'scroll',
    expectedOutcome: 'Features section is visible in the viewport.',
  },
  {
    id: 'select-button',
    name: 'Select a Button',
    description: 'Click the "Learn More" button on the home page.',
    type: 'select',
    expectedOutcome: 'Button click is registered and feedback is shown.',
  },
  {
    id: 'type-search',
    name: 'Enter Search Text',
    description: 'Type "accessibility" into the search field.',
    type: 'type',
    expectedOutcome: 'The word "accessibility" appears in the search field.',
  },
  {
    id: 'complete-form',
    name: 'Complete Sample Form',
    description: 'Fill in the name field and check the agreement checkbox in the sample form.',
    type: 'form',
    expectedOutcome: 'Name field is filled and checkbox is checked.',
  },
];

export function createMockSessions(): EvaluationSession[] {
  const now = Date.now();
  const taskIds = [
    'nav-about',
    'scroll-section',
    'select-button',
    'type-search',
    'complete-form',
  ];

  const conventionalTrials: EvaluationTrial[] = Array.from({ length: 25 }, (_, index) => {
    const taskId = taskIds[index % taskIds.length];
    const isSuccess = index < 22;
    const isError = index < 4;
    const isAccidental = index < 2;
    const duration = 8400;
    const start = now - (25 - index) * 60_000;

    return {
      id: `demo-conventional-${index + 1}`,
      taskId,
      inputMode: 'conventional',
      startTime: start,
      endTime: start + duration,
      completed: true,
      success: isSuccess,
      errors: isError ? 1 : 0,
      accidentalActivations: isAccidental ? 1 : 0,
      voiceCommandsIssued: 0,
      voiceCommandsRecognized: 0,
      notes: 'Demo dataset aligned to the sample usability baseline for mouse + keyboard.',
    };
  });

  const handsfreeTrials: EvaluationTrial[] = Array.from({ length: 25 }, (_, index) => {
    const taskId = taskIds[index % taskIds.length];
    const isSuccess = index < 23;
    const isError = index < 3;
    const isAccidental = index === 0;
    const duration = 9700;
    const start = now - (25 - index) * 60_000 + 30_000;
    const voiceCommandsIssued = 5;
    const voiceCommandsRecognized = index < 14 ? 5 : 4;

    return {
      id: `demo-handsfree-${index + 1}`,
      taskId,
      inputMode: 'handsfree',
      startTime: start,
      endTime: start + duration,
      completed: true,
      success: isSuccess,
      errors: isError ? 1 : 0,
      accidentalActivations: isAccidental ? 1 : 0,
      voiceCommandsIssued,
      voiceCommandsRecognized,
      notes: 'Demo dataset aligned to the sample usability baseline for handsfree interaction.',
    };
  });

  return [
    {
      id: 'demo-session-mouse-keyboard',
      startTime: now - 32 * 60_000,
      endTime: now - 1 * 60_000,
      trials: conventionalTrials,
    },
    {
      id: 'demo-session-handsfree',
      startTime: now - 34 * 60_000,
      endTime: now - 2 * 60_000,
      trials: handsfreeTrials,
    },
  ];
}

export function loadSessions(): EvaluationSession[] {
  const mockSessions = createMockSessions();

  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(mockSessions));
  } catch (e) {
    console.warn('Failed to save seeded eval sessions', e);
  }

  return mockSessions;
}

export function saveSessions(sessions: EvaluationSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Failed to save eval sessions', e);
  }
}

export function createSession(): EvaluationSession {
  return {
    id: crypto.randomUUID(),
    startTime: Date.now(),
    endTime: null,
    trials: [],
  };
}

export function createTrial(
  taskId: string,
  inputMode: 'conventional' | 'handsfree'
): EvaluationTrial {
  return {
    id: crypto.randomUUID(),
    taskId,
    inputMode,
    startTime: Date.now(),
    endTime: null,
    completed: false,
    success: false,
    errors: 0,
    accidentalActivations: 0,
    voiceCommandsIssued: 0,
    voiceCommandsRecognized: 0,
    notes: '',
  };
}

/** Compute average task completion time for a set of trials (ms) */
export function avgCompletionTime(trials: EvaluationTrial[]): number | null {
  const completed = trials.filter((t) => t.completed && t.endTime);
  if (completed.length === 0) return null;
  const total = completed.reduce((sum, t) => sum + (t.endTime! - t.startTime), 0);
  return total / completed.length;
}

/** Voice command accuracy: recognized / issued */
export function voiceAccuracy(trials: EvaluationTrial[]): number | null {
  const total = trials.reduce((s, t) => s + t.voiceCommandsIssued, 0);
  if (total === 0) return null;
  const recognized = trials.reduce((s, t) => s + t.voiceCommandsRecognized, 0);
  return recognized / total;
}

/** Total selection errors */
export function totalErrors(trials: EvaluationTrial[]): number {
  return trials.reduce((s, t) => s + t.errors, 0);
}

/** Total accidental activations */
export function totalAccidentalActivations(trials: EvaluationTrial[]): number {
  return trials.reduce((s, t) => s + t.accidentalActivations, 0);
}

/** Success rate */
export function successRate(trials: EvaluationTrial[]): number | null {
  if (trials.length === 0) return null;
  const successes = trials.filter((t) => t.success).length;
  return successes / trials.length;
}
