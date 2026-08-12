import React from 'react';
import { Tell } from '@/data/cards';

interface HighlightedTextProps {
  text: string;
  tells?: Tell[];
  showHighlights?: boolean;
}

export function HighlightedText({ text, tells, showHighlights = false }: HighlightedTextProps) {
  if (!showHighlights || !tells || tells.length === 0) return <>{text}</>;

  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    let earliestIndex = -1;
    let earliestSpan = '';

    for (const tell of tells) {
      const idx = remaining.indexOf(tell.span);
      if (idx !== -1) {
        if (earliestIndex === -1 || idx < earliestIndex) {
          earliestIndex = idx;
          earliestSpan = tell.span;
        }
      }
    }

    if (earliestIndex === -1) {
      elements.push(<span key={`end-${keyIdx}`}>{remaining}</span>);
      break;
    }

    if (earliestIndex > 0) {
      elements.push(<span key={`text-${keyIdx}`}>{remaining.substring(0, earliestIndex)}</span>);
    }
    
    elements.push(
      <mark
        key={`mark-${keyIdx}`}
        className="px-1 font-semibold rounded-[3px]"
        style={{ backgroundColor: 'rgba(240,205,120,0.95)', color: '#221B16', boxShadow: 'inset 0 -2px 0 #C98A1B' }}
      >
        {earliestSpan}
      </mark>
    );
    
    remaining = remaining.substring(earliestIndex + earliestSpan.length);
    keyIdx++;
  }

  return <>{elements}</>;
}
