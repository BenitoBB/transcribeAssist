'use client';

import React, { useState } from 'react';
import { DefinitionPopup } from './DefinitionPopup';

interface WordWrapperProps {
  text: string;
}

export function WordWrapper({ text }: WordWrapperProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const handleDoubleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    const target = e.target as HTMLSpanElement;
    const word = target.innerText.trim().replace(/[\p{P}\p{S}]/gu, '');

    if (word) {
      setSelectedWord(word);
    }
  };

  const closePopup = () => {
    setSelectedWord(null);
  };

  // Divide el texto en palabras y espacios, manteniendo los espacios
  const elements = text.split(/(\s+)/).map((segment, index) => {
    // Si no es un espacio en blanco, es una palabra
    if (segment.trim() !== '') {
      return (
        <span
          key={index}
          onDoubleClick={handleDoubleClick}
          className="cursor-pointer hover:bg-yellow-200/50 dark:hover:bg-yellow-700/50 rounded"
        >
          {segment}
        </span>
      );
    }
    // Devuelve el espacio o salto de línea
    return <React.Fragment key={index}>{segment}</React.Fragment>;
  });

  return (
    <>
      <p>{elements}</p>
      {selectedWord && (
        <DefinitionPopup word={selectedWord} onClose={closePopup} />
      )}
    </>
  );
}
