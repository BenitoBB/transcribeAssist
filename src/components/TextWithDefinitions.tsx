'use client';

import React from 'react';

interface TextWithDefinitionsProps {
  text: string;
}

/**
 * Este componente ahora simplemente renderiza el texto.
 * La funcionalidad de doble clic para definiciones ha sido eliminada.
 */
export function TextWithDefinitions({ text }: TextWithDefinitionsProps) {
  // Divide el texto en párrafos basados en saltos de línea
  const paragraphs = text.split('\n').map((paragraph, index) => (
    <p key={index} className="mb-4 last:mb-0">
      {paragraph}
    </p>
  ));

  return <>{paragraphs}</>;
}
