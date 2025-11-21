'use client';

import React, { useState } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { defineWord, DefineWordOutput } from '@/ai/flows/define-word-flow';
import { Loader2 } from 'lucide-react';

interface WordDefinitionProps {
  word: string;
}

export function WordDefinition({ word }: WordDefinitionProps) {
  const [result, setResult] = useState<DefineWordOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Evitamos que palabras muy cortas o sin letras sean consultadas
  const canDefine = word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]/g, '').length > 2;

  const handleDoubleClick = async () => {
    if (!canDefine || isLoading) return;

    setIsLoading(true);
    setIsOpen(true);
    try {
      // Limpia la palabra de puntuación antes de enviarla
      const cleanWord = word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]/g, '');
      const response = await defineWord({ word: cleanWord });
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult({
        definition: null,
        error: 'Hubo un error al contactar el servicio.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <span
          onDoubleClick={handleDoubleClick}
          className={
            canDefine
              ? 'cursor-pointer hover:bg-accent rounded-sm'
              : 'cursor-default'
          }
        >
          {word}{' '}
        </span>
      </HoverCardTrigger>
      {isOpen && (
        <HoverCardContent className="w-80" align="start">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="ml-2">Buscando definición...</p>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Definición de "{word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]/g, '')}"
              </h4>
              {result?.definition ? (
                <p className="text-sm">{result.definition}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {result?.error || 'No se encontró una definición.'}
                </p>
              )}
            </div>
          )}
        </HoverCardContent>
      )}
    </HoverCard>
  );
}
