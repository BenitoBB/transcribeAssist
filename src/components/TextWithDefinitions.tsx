'use client';

import React, { Fragment } from 'react';

interface TextWithDefinitionsProps {
  text: string;
}

export function TextWithDefinitions({ text }: TextWithDefinitionsProps) {
  // Divide el texto en párrafos por los saltos de línea
  const paragraphs = text.split('\n').map((paragraph, pIndex) => {
    // Dentro de cada párrafo, divide en palabras y espacios
    const elements = paragraph.split(/(\s+)/).map((segment, sIndex) => {
      // Simplemente renderiza el segmento de texto
      // sin ninguna interactividad de doble clic.
      return <Fragment key={sIndex}>{segment}</Fragment>;
    });

    // Envuelve cada párrafo en un <p> y añade un <br> para los saltos de línea explícitos
    // para mantener el formato legible que implementamos antes.
    return (
      <Fragment key={pIndex}>
        {elements}
        {pIndex < text.split('\n').length -1 && <br />}
      </Fragment>
    );
  });

  return <>{paragraphs}</>;
}
