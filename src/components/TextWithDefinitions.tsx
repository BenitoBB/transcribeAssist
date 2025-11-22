'use client';

import React, { useState, useTransition, Fragment } from 'react';
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
    const word = target.innerText.trim().replace(/[.,¡!¿?]/g, '');

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

  // Divide el texto en párrafos por los saltos de línea
  const paragraphs = text.split('\n').map((paragraph, pIndex) => {
    // Dentro de cada párrafo, divide en palabras y espacios
    const elements = paragraph.split(/(\s+)/).map((segment, sIndex) => {
      if (segment.trim() !== '') {
        return (
          <span
            key={sIndex}
            onDoubleClick={handleDoubleClick}
            className="cursor-pointer hover:bg-yellow-200/50 dark:hover:bg-yellow-700/50 rounded"
          >
            {segment}
          </span>
        );
      }
      return <Fragment key={sIndex}>{segment}</Fragment>;
    });
    // Envuelve cada párrafo en un <p> y añade un <br> para los saltos de línea explícitos
    return (
      <Fragment key={pIndex}>
        {elements}
        <br />
      </Fragment>
    );
  });

  return (
    <>
      <div>{paragraphs}</div>
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
