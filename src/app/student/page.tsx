'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  FileDown,
  MoreVertical,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingsButton } from '@/components/settings/SettingsButton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useStyle } from '@/context/StyleContext';
import { useTranscription } from '@/hooks/use-transcription';
import { defineWord } from '@/components/define-word';
import { DefinitionPopup } from '@/components/DefinitionPopup';
import { joinSession, onDataReceived, onConnectionStatusChange, ConnectionStatus } from '@/lib/p2p';

export default function StudentPage() {
  const { transcription, setTranscription } = useTranscription();
  const { style } = useStyle();
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState('');
  const [definitionState, setDefinitionState] = useState<{
    word: string;
    definition: string | null;
    isLoading: boolean;
  } | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const hasConnected = useRef(false);

  useEffect(() => {
    const unsubData = onDataReceived((data: any) => {
      if (typeof data === 'string') {
        setTranscription(prev => prev + data);
      } else if (data.type === 'full_text') {
        setTranscription(data.text);
      }
    });

    const unsubStatus = onConnectionStatusChange(status => {
      setConnectionStatus(status);
      if(status === 'connected') {
        hasConnected.current = true;
        setTranscription(''); // Limpiar transcripción inicial
      }
    });

    return () => {
      unsubData();
      unsubStatus();
    };
  }, [setTranscription]);

  const handleConnect = () => {
    if (sessionId.trim()) {
      joinSession(sessionId.trim());
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, introduce un ID de sala válido.',
      });
    }
  };

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
      
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
             <div className={`flex items-center gap-2 text-sm ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus === 'connected' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span>{connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estado de la conexión</p>
          </TooltipContent>
        </Tooltip>
        <SettingsButton />
      </div>

      {!hasConnected.current ? (
        <div className="w-full max-w-sm space-y-4 text-center">
           <h1 className="text-2xl sm:text-3xl font-bold">Unirse a una Sala</h1>
           <p className="text-muted-foreground">Introduce el ID de la sala proporcionado por el maestro.</p>
           <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="ID de la Sala"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="text-center"
            />
            <Button onClick={handleConnect} disabled={connectionStatus === 'connecting'}>
              {connectionStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
            </Button>
          </div>
          {connectionStatus === 'error' && (
            <p className="text-sm text-destructive">No se pudo conectar a la sala. Verifica el ID y la conexión.</p>
          )}
        </div>
      ) : (
        <>
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Vista del Alumno</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Viendo la transcripción de la sala: <span className="font-mono text-primary">{sessionId}</span>
            </p>
          </div>

          <Card className="w-full max-w-4xl h-[60vh] flex flex-col shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
              <CardTitle className="text-base font-semibold">
                Transcripción en Tiempo Real
              </CardTitle>
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
                  {transcription || "Esperando transcripción del maestro..."}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}