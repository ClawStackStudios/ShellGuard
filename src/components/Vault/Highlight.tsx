import React from 'react';

interface HighlightProps {
  text: string;
  match: string;
}

export function Highlight({ text, match }: HighlightProps) {
  if (!match.trim()) return <>{text}</>;

  const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedMatch})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === match.toLowerCase() ? (
          <span key={`highlight-${i}`} className="bg-claw-cyan/30 text-theme-main rounded px-0.5">
            {part}
          </span>
        ) : (
          <span key={`highlight-${i}`}>{part}</span>
        )
      )}
    </>
  );
}
