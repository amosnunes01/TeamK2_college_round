import { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  InteractionState, 
  PointerPosition, 
  TargetElement, 
  PendingAction, 
  HandsfreeSettings,
  ActivationRecord,
  VoiceCommand
} from '../types';

interface UseIntentGuardProps {
  pointerPosition: PointerPosition | null;
  settings: HandsfreeSettings;
  interactionState: InteractionState;
  setInteractionState: (state: InteractionState) => void;
  isTracking: boolean;
}

export function useIntentGuard({
  pointerPosition,
  settings,
  interactionState,
  setInteractionState,
  isTracking
}: UseIntentGuardProps) {
  const [currentTarget, setCurrentTarget] = useState<TargetElement | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [activationRecords, setActivationRecords] = useState<ActivationRecord[]>([]);
  
  const lastActivationTime = useRef<number>(0);
  const dwellStartTime = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const lastTargetElement = useRef<HTMLElement | null>(null);
  const pointerPositionRef = useRef<PointerPosition | null>(pointerPosition);
  const settingsRef = useRef(settings);
  const stateRef = useRef(interactionState);

  // Sync refs
  useEffect(() => { pointerPositionRef.current = pointerPosition; }, [pointerPosition]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { stateRef.current = interactionState; }, [interactionState]);

  const logActivation = useCallback((action: PendingAction, result: ActivationRecord['result'], reason?: string) => {
    setActivationRecords(prev => {
      const newHistory = [...prev, {
        id: crypto.randomUUID(),
        action,
        result,
        timestamp: Date.now(),
        reason
      }];
      return newHistory.slice(-50); // keep last 50
    });
  }, []);

  const getTargetType = (el: HTMLElement): TargetElement['type'] => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'button' || el.getAttribute('role') === 'button') return 'button';
    if (tag === 'a') return 'link';
    if (tag === 'input' && (el as HTMLInputElement).type === 'checkbox') return 'checkbox';
    if (tag === 'input' || tag === 'textarea') return 'input';
    if (el.closest('.card') || el.classList.contains('card')) return 'card';
    return 'other';
  };

  const isInteractive = (el: HTMLElement): boolean => {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return (
      tag === 'button' ||
      tag === 'a' ||
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      el.getAttribute('role') === 'button' ||
      el.tabIndex >= 0 ||
      window.getComputedStyle(el).cursor === 'pointer'
    );
  };

  const executeAction = useCallback((action: PendingAction) => {
    if (Date.now() - lastActivationTime.current < settingsRef.current.activationCooldown) {
      logActivation(action, 'blocked', 'cooldown');
      return;
    }

    setInteractionState('executing');
    
    // Perform click
    if (action.target.element && document.body.contains(action.target.element)) {
      action.target.element.click();
      if (action.target.type === 'input') {
        action.target.element.focus();
      }
      logActivation(action, 'completed');
      lastActivationTime.current = Date.now();
      
      // Flash highlight
      action.target.element.style.boxShadow = '0 0 0 4px rgba(74, 222, 128, 0.5)';
      setTimeout(() => {
        if (action.target.element) {
          action.target.element.style.boxShadow = '';
        }
      }, 300);
    } else {
      logActivation(action, 'blocked', 'Element no longer in DOM');
    }

    setTimeout(() => {
      if (stateRef.current !== 'paused' && stateRef.current !== 'error') {
        setInteractionState('tracking');
      }
      setPendingAction(null);
    }, 500); // Executing state duration
  }, [logActivation, setInteractionState]);

  const triggerActivation = useCallback((action: PendingAction) => {
    // Check if sensitive action
    const isSensitive = action.target.type === 'button' && (action.target.label.toLowerCase().includes('delete') || action.target.label.toLowerCase().includes('submit'));
    
    if (settingsRef.current.confirmSensitiveActions && isSensitive) {
      setInteractionState('pendingConfirmation');
      setPendingAction(action);
    } else {
      executeAction(action);
    }
  }, [executeAction, setInteractionState]);

  // Command handlers
  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    if (!isTracking || stateRef.current === 'paused' || stateRef.current === 'error') return;

    if (command.parsed === 'click' || command.parsed === 'select') {
      // Execute click on current target
      if (currentTarget) {
        const action: PendingAction = {
          id: crypto.randomUUID(),
          target: currentTarget,
          action: 'click',
          createdAt: Date.now(),
          dwellProgress: 1,
          confirmed: false
        };
        triggerActivation(action);
      }
    } else if (command.parsed === 'confirm') {
      if (stateRef.current === 'pendingConfirmation' && pendingAction) {
        executeAction({ ...pendingAction, confirmed: true });
      }
    } else if (command.parsed === 'cancel') {
      if (stateRef.current === 'pendingConfirmation' && pendingAction) {
        logActivation(pendingAction, 'cancelled', 'User voice cancel');
        setInteractionState('tracking');
        setPendingAction(null);
      } else if (stateRef.current === 'targeted') {
        // Just reset dwell
        dwellStartTime.current = Date.now();
      }
    }
  }, [isTracking, currentTarget, triggerActivation, pendingAction, executeAction, logActivation, setInteractionState]);

  // Main targeting and dwell loop
  useEffect(() => {
    if (!isTracking || stateRef.current === 'paused' || stateRef.current === 'error') {
      if (currentTarget) {
        setCurrentTarget(null);
        const s = stateRef.current;
        if (s === 'targeted' || s === 'pendingConfirmation') {
          if (pendingAction) {
            logActivation(pendingAction, 'cancelled', 'Tracking lost/paused');
            setPendingAction(null);
          }
          const s2 = stateRef.current;
          if (s2 !== 'paused' && s2 !== 'error') {
            setInteractionState('idle');
          }
        }
      }
      return;
    }

    const checkPointer = () => {
      const pos = pointerPositionRef.current;
      if (!pos) {
        if (currentTarget) {
          setCurrentTarget(null);
          if (stateRef.current === 'targeted' || stateRef.current === 'pendingConfirmation') {
            setInteractionState('tracking');
            if (pendingAction) logActivation(pendingAction, 'cancelled', 'Pointer lost');
            setPendingAction(null);
          }
        }
        animationFrameId.current = requestAnimationFrame(checkPointer);
        return;
      }

      // Hide pointer overlay momentarily to find element underneath
      const pointerEls = document.querySelectorAll('.handsfree-pointer');
      pointerEls.forEach(el => (el as HTMLElement).style.display = 'none');
      
      let el = document.elementFromPoint(pos.x, pos.y) as HTMLElement | null;
      
      pointerEls.forEach(el => (el as HTMLElement).style.display = 'block');

      if (el) {
        // Find closest interactive element
        const interactive = (el.closest('button, a, input, textarea, select, [role="button"], [tabindex]') || el) as HTMLElement;
        
        if (isInteractive(interactive)) {
          if (lastTargetElement.current !== interactive) {
            // New target entered
            lastTargetElement.current = interactive;
            const targetInfo: TargetElement = {
              id: crypto.randomUUID(),
              element: interactive,
              label: interactive.innerText || interactive.getAttribute('aria-label') || interactive.getAttribute('name') || 'Element',
              type: getTargetType(interactive),
              rect: interactive.getBoundingClientRect()
            };
            setCurrentTarget(targetInfo);
            dwellStartTime.current = Date.now();
            if (stateRef.current === 'tracking') {
              setInteractionState('targeted');
            }
          } else if (stateRef.current === 'targeted' && settingsRef.current.dwellEnabled) {
            // Dwell in progress
            const elapsed = Date.now() - dwellStartTime.current;
            const progress = Math.min(1, elapsed / settingsRef.current.dwellTime);
            
            // Only create pending action if not already executing
            if (progress >= 1 && Date.now() - lastActivationTime.current >= settingsRef.current.activationCooldown) {
              const action: PendingAction = {
                id: crypto.randomUUID(),
                target: currentTarget!,
                action: 'click',
                createdAt: Date.now(),
                dwellProgress: 1,
                confirmed: false
              };
              triggerActivation(action);
            } else if (currentTarget) {
              // Update dwell progress for UI
              setPendingAction({
                id: 'dwell-temp',
                target: currentTarget,
                action: 'click',
                createdAt: dwellStartTime.current,
                dwellProgress: progress,
                confirmed: false
              });
            }
          }
        } else {
          // Over non-interactive element
          if (currentTarget) {
            setCurrentTarget(null);
            lastTargetElement.current = null;
            if (stateRef.current === 'targeted') {
              setInteractionState('tracking');
              setPendingAction(null);
            }
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(checkPointer);
    };

    animationFrameId.current = requestAnimationFrame(checkPointer);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isTracking, currentTarget, triggerActivation, logActivation, setInteractionState, pendingAction]);

  return {
    currentTarget,
    pendingAction,
    activationRecords,
    handleVoiceCommand
  };
}
