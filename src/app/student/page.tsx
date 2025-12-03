'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, MoreVertical, Copy, FileDown, LoaderCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranscription } from '@/hooks/use-transcription';
import { useStyle } from '@/context/StyleContext';
import { useToast } from '@/hooks/use-toast';
import { SettingsButton } from '@/components/settings/SettingsButton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React, { useState, useEffect } from 'react';
import { defineWord } from '@/components/define-word';
import { onTranscriptionUpdate } from '@/lib/transcription';
import { DefinitionPopup } from '@/components/DefinitionPopup';


function StudentTranscriptionClient() {
  const { setTranscription } = useTranscription();
  useEffect(() => {
    const unsubscribe = onTranscriptionUpdate((newText: string) => {
      setTranscription(newText);
    });
    return () => unsubscribe();
  }, [setTranscription]);
  return null; // Este componente no renderiza nada
}

export default function StudentPage() {
  const { transcription } = useTranscription();
  const { style } = useStyle();
  const { toast } = useToast();

  const [definitionState, setDefinitionState] = useState<{
    word: string;
    definition: string | null;
    isLoading: boolean;
  } | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    toast({
      title: 'Copiado',
      description: 'La transcripción ha sido copiada al portapapeles.',
    });
  };

  const handleSave = () => {
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcripcion.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Guardado',
      description:
        'La transcripción se está descargando como transcripcion.txt.',
    });
  };

  const handleWordDoubleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const word = selection?.toString().trim();
    
    if (word) {
      setDefinitionState({ word, definition: null, isLoading: true });
      const definition = await defineWord(word);
      setDefinitionState({ word, definition, isLoading: false });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* El componente para escuchar la transcripción no renderiza nada */}
      <StudentTranscriptionClient />
      
       {definitionState && (
        <DefinitionPopup
          word={definitionState.word}
          definition={definitionState.definition}
          isLoading={definitionState.isLoading}
          onClose={() => setDefinitionState(null)}
        />
      )}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-4">
        <Link href="/">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Volver a la página principal</p>
            </TooltipContent>
          </Tooltip>
        </Link>
      </div>

      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Vista del Alumno</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Aquí puedes ver la transcripción de la clase en tiempo real.
        </p>
      </div>

      <Card className="w-full max-w-4xl h-[60vh] flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
          <CardTitle className="text-base font-semibold">
            Transcripción
          </CardTitle>
          <div className="flex items-center gap-2">
            <SettingsButton />
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Más opciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Más opciones</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copiar al portapapeles</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSave}>
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>Guardar como .txt</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <ScrollArea className="h-full w-full">
            <div
              className="p-4 prose bg-transparent"
              style={{
                fontSize: `${style.fontSize}px`,
                lineHeight: style.lineHeight,
                letterSpacing: `${style.letterSpacing}px`,
                fontFamily: style.fontFamily,
                height: '100%',
                color: 'inherit',
              }}
              onDoubleClick={handleWordDoubleClick}
            >
              {transcription}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
