'use client';

import { X } from 'lucide-react';
import React from 'react';
import { Rnd } from 'react-rnd';

interface DefinitionPopupProps {
  word: string;
  onClose: () => void;
}

export function DefinitionPopup({ word, onClose }: DefinitionPopupProps) {
  // Construye la URL para el diccionario de la RAE.
  // encodeURIComponent se asegura de que la palabra se formatea correctamente para una URL.
  const dictionaryUrl = `https://dle.rae.es/${encodeURIComponent(word)}`;

  return (
    <Rnd
      default={{
        x: window.innerWidth / 2 - 200,
        y: 150,
        width: 400,
        height: 500,
      }}
      minWidth={300}
      minHeight={300}
      bounds="parent"
      dragHandleClassName="drag-handle"
      className="z-50 flex flex-col bg-card rounded-lg shadow-2xl border"
    >
      <div className="drag-handle cursor-move flex items-center justify-between p-2 border-b bg-muted/50 rounded-t-lg">
        <h3 className="font-semibold text-sm pl-2">Definición de "{word}"</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-grow bg-white">
        <iframe
          src={dictionaryUrl}
          title={`Definición de ${word}`}
          className="w-full h-full border-0"
        />
      </div>
    </Rnd>
  );
}
