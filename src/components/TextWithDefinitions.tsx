'use client';

import React, { useState, useTransition } from 'react';
import { DefinitionPopup } from './DefinitionPopup';
import { defineWord } from './define-word';

interface TextWithDefinitionsProps {
  text: string;
}

export function TextWithDefinitions({ text }: TextWithDefinitionsProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDoubleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    const target = e.target as HTMLSpanElement;
    // Limpia la palabra de puntuación común al final.
    const word = target.innerText.trim().replace(/[\p{P}\p{S}]/gu, '');

    if (word) {
      setSelectedWord(word);
      setDefinition(null); // Resetea la definición anterior
      startTransition(async () => {
        const result = await defineWord(word);
        setDefinition(result);
      });
    }
  };

  const closePopup = () => {
    setSelectedWord(null);
    setDefinition(null);
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
        <DefinitionPopup
          word={selectedWord}
          definition={definition}
          isLoading={isPending}
          onClose={closePopup}
        />
      )}
    </>
  );
}
