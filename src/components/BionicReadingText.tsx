'use client';

import React from 'react';

interface BionicReadingTextProps {
  text: string;
}

const BionicReadingText: React.FC<BionicReadingTextProps> = ({ text }) => {
  const processWord = (word: string) => {
    // Si la palabra es muy corta, no la procesamos
    if (word.length <= 3) {
      return word;
    }
    const mid = Math.ceil(word.length / 2);
    const boldPart = word.slice(0, mid);
    const normalPart = word.slice(mid);
    
    // Devolvemos el JSX directamente
    return (
      <>
        <span className="font-bold">{boldPart}</span>
        {normalPart}
      </>
    );
  };

  // Divide el texto en palabras y espacios para mantener el formato
  const parts = text.split(/(\s+)/);

  return (
    <>
      {parts.map((part, index) =>
        /\s+/.test(part) ? (
          // Si es un espacio, lo devolvemos tal cual
          <React.Fragment key={index}>{part}</React.Fragment>
        ) : (
          // Si es una palabra, la procesamos
          <React.Fragment key={index}>{processWord(part)} </React.Fragment>
        )
      )}
    </>
  );
};

export { BionicReadingText };
