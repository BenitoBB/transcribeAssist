'use client';

import { X, LoaderCircle } from 'lucide-react';
import React from 'react';
import { Rnd } from 'react-rnd';

interface DefinitionPopupProps {
  word: string;
  definition: string | null;
  isLoading: boolean;
  onClose: () => void;
}

export function DefinitionPopup({
  word,
  definition,
  isLoading,
  onClose,
}: DefinitionPopupProps) {
  return (
    <Rnd
      default={{
        x: window.innerWidth / 2 - 200,
        y: 150,
        width: 400,
        height: 300,
      }}
      minWidth={250}
      minHeight={200}
      bounds="parent"
      dragHandleClassName="drag-handle"
      className="z-50 flex flex-col bg-card rounded-lg shadow-2xl border"
    >
      <div className="drag-handle cursor-move flex items-center justify-between p-2 border-b bg-muted/50 rounded-t-lg">
        <h3 className="font-semibold text-sm pl-2 truncate">Definición de "{word}"</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent flex-shrink-0"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-grow p-4 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="sr-only">Cargando definición...</p>
          </div>
        )}
        {!isLoading && definition && (
          <p className="text-sm text-foreground">{definition}</p>
        )}
        {!isLoading && !definition && (
          <p className="text-sm text-muted-foreground">
            No se encontró una definición para esta palabra.
          </p>
        )}
      </div>
    </Rnd>
  );
}
