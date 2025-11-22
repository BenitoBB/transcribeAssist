'use client';

import React from 'react';

interface LineHighlighterProps {
  lineHeight: number;
  mouseY: number;
  isVisible: boolean;
}

export function LineHighlighter({ lineHeight, mouseY, isVisible }: LineHighlighterProps) {
  if (!isVisible || !lineHeight) {
    return null;
  }

  // Calculate which line the mouse is on
  const currentLine = Math.floor(mouseY / lineHeight);
  // Calculate the top position of that line
  const topPosition = currentLine * lineHeight;

  return (
    <div
      className="absolute left-0 w-full bg-primary/10 rounded pointer-events-none transition-opacity duration-300"
      style={{
        height: `${lineHeight}px`,
        transform: `translateY(${topPosition}px)`,
        opacity: isVisible ? 1 : 0,
        // zIndex: -1 was hiding it behind the parent background
      }}
      aria-hidden="true"
    />
  );
}
