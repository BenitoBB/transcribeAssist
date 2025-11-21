
'use client';

import React, { useState, useCallback } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { defineWord } from '@/ai/flows/define-word-flow';
import { Skeleton } from './ui/skeleton';

interface WordDefinitionProps {
  children: React.ReactNode;
  word: string;
}

export function WordDefinition({ children, word }: WordDefinitionProps) {
  const [definition, setDefinition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Usamos useCallback para evitar que la función se recree en cada render
  const handleDoubleClick = useCallback(async () => {
    // Si ya está abierto, no hacer nada
    if (isOpen) return;

    setIsOpen(true);
    // Si ya tenemos una definición, no la volvemos a buscar
    if (definition) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await defineWord({ word: word.replace(/[,.]/g, '') });
      setDefinition(result.definition);
    } catch (error) {
      console.error('Error al obtener la definición:', error);
      setDefinition('No se pudo obtener la definición.');
    } finally {
      setIsLoading(false);
    }
  }, [word, definition, isOpen]);

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <span
          onDoubleClick={handleDoubleClick}
          className="cursor-pointer hover:bg-accent rounded-sm"
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-semibold">{word}</h4>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <p className="text-sm">{definition || 'Haz doble clic para ver la definición.'}</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
