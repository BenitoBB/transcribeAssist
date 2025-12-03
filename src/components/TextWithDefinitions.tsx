'use client';

import React from 'react';
import { useState } from 'react';
import { defineWord } from './define-word';
import dynamic from 'next/dynamic';

const DefinitionPopupWithNoSSR = dynamic(
  () => import('./DefinitionPopup').then((mod) => mod.DefinitionPopup),
  { ssr: false }
);

interface TextWithDefinitionsProps {
  text: string;
}

export function TextWithDefinitions({ text }: TextWithDefinitionsProps) {
  const [definitionState, setDefinitionState] = useState<{
    word: string;
    definition: string | null;
    isLoading: boolean;
  } | null>(null);

  const handleWordDoubleClick = async (e: React.MouseEvent<HTMLSpanElement>) => {
    const word = (e.target as HTMLElement).innerText.trim();
    if (word) {
      setDefinitionState({ word, definition: null, isLoading: true });
      const definition = await defineWord(word);
      setDefinitionState({ word, definition, isLoading: false });
    }
  };

  const renderTextWithSpans = (text: string) => {
    return text.split('\n').map((paragraph, pIndex) => (
      <p key={pIndex} className="mb-4 last:mb-0">
        {paragraph.split(/(\s+)/).map((word, wIndex) => {
          if (word.trim() === '') return word;
          return (
            <span key={wIndex} className="cursor-pointer" onDoubleClick={handleWordDoubleClick}>
              {word}
            </span>
          );
        })}
      </p>
    ));
  };

  return (
    <>
      {definitionState && (
        <DefinitionPopupWithNoSSR
          word={definitionState.word}
          definition={definitionState.definition}
          isLoading={definitionState.isLoading}
          onClose={() => setDefinitionState(null)}
        />
      )}
      {renderTextWithSpans(text)}
    </>
  );
}
