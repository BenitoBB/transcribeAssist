'use client';

import React, { useState, useTransition } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, LoaderCircle, Search } from 'lucide-react';
import { searchDictionary } from './search-dictionary';
import type { DictionaryEntry } from './search-dictionary';

interface DictionaryPanelProps {
  onClose: () => void;
}

export function DictionaryPanel({ onClose }: DictionaryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<DictionaryEntry[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    startTransition(async () => {
      setError(null);
      setResults(null);
      const searchResult = await searchDictionary(searchTerm);
      if (searchResult.error) {
        setError(searchResult.error);
        setResults(null);
      } else {
        setResults(searchResult.data);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Rnd
      default={{
        x: window.innerWidth - 550,
        y: 80,
        width: 450,
        height: 500,
      }}
      minWidth={300}
      minHeight={400}
      bounds="parent"
      dragHandleClassName="drag-handle"
      className="z-50 flex flex-col bg-card rounded-lg shadow-2xl border pointer-events-auto"
    >
      <CardHeader className="drag-handle cursor-move flex flex-row items-center justify-between p-2 border-b rounded-t-lg">
        <CardTitle className="font-semibold text-sm pl-2">
          Diccionario
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          aria-label="Cerrar diccionario"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col">
        <div className="p-2 flex gap-2 border-b">
          <Input
            placeholder="Buscar una palabra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
          />
          <Button onClick={handleSearch} disabled={isPending || !searchTerm.trim()} size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-full">
          <div className="p-4">
            {isPending && (
              <div className="flex items-center justify-center h-full">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {error && (
              <div className="text-center text-sm text-destructive">
                <p>{error}</p>
              </div>
            )}
            {results && (
              <div className="space-y-4">
                {results.map((entry, index) => (
                  <div key={index}>
                    <h2 className="text-2xl font-bold">{entry.word}</h2>
                    {entry.phonetic && <p className="text-muted-foreground">{entry.phonetic}</p>}
                    
                    {entry.meanings.map((meaning, mIndex) => (
                      <div key={mIndex} className="mt-3">
                        <h3 className="text-lg font-semibold italic">{meaning.partOfSpeech}</h3>
                        {meaning.definitions.map((def, dIndex) => (
                          <div key={dIndex} className="mt-2 pl-4 border-l-2 border-primary">
                            <p>{def.definition}</p>
                            {def.example && (
                              <p className="text-sm text-muted-foreground italic mt-1">
                                Ejemplo: "{def.example}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {!isPending && !results && !error && (
                <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                    <p>Busca una palabra para ver su definición.</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Rnd>
  );
}