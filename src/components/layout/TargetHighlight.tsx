import React from 'react';
import type { TargetElement, InteractionState } from '../../types';

interface TargetHighlightProps {
  target: TargetElement | null;
  interactionState: InteractionState;
}

export const TargetHighlight: React.FC<TargetHighlightProps> = ({ target, interactionState }) => {
  if (!target) return null;

  const rect = target.element.getBoundingClientRect();

  const borderColor =
    interactionState === 'pendingConfirmation' ? 'border-amber-400' :
    interactionState === 'executing' ? 'border-green-400' :
    'border-indigo-400';

  const bgColor =
    interactionState === 'pendingConfirmation' ? 'bg-amber-400/10' :
    interactionState === 'executing' ? 'bg-green-400/10' :
    'bg-indigo-400/5';

  return (
    <div
      className={`pointer-events-none fixed z-[9998] border-2 rounded-lg transition-all duration-100 ${borderColor} ${bgColor}`}
      style={{
        left: `${rect.left - 4}px`,
        top: `${rect.top - 4}px`,
        width: `${rect.width + 8}px`,
        height: `${rect.height + 8}px`,
      }}
    >
      <span className={`absolute -top-5 left-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
        interactionState === 'pendingConfirmation' ? 'bg-amber-500 text-black' :
        interactionState === 'executing' ? 'bg-green-500 text-black' :
        'bg-indigo-500 text-white'
      }`}>
        {target.label.slice(0, 25)}
      </span>
    </div>
  );
};
