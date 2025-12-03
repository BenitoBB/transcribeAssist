'use client';

import { useState, useTransition, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Pencil,
  KeyRound,
  LoaderCircle,
  Mic,
  MicOff,
} from 'lucide-react';
import { DrawingToolbar } from './components/DrawingToolbar';
import { extractKeywords, Keyword } from '@/ai/flows/extract-keywords-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranscription } from '@/hooks/use-transcription';
import { DrawingCanvas } from './components/DrawingCanvas';
import { Command, TranscriptionPanel } from './components/TranscriptionPanel';
import {
  startTranscription,
  stopTranscription,
  registerCommands,
  onStateChange,
  onTranscriptionUpdate,
} from '@/lib/transcription';

export default function TeacherPage() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [clearCanvas, setClearCanvas] = useState(false);

  const { transcription, setTranscription, isRecording, setIsRecording } = useTranscription();
  
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isKeywordsDialogOpen, setIsKeywordsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [panelCommand, setPanelCommand] = useState<Command>(null);


  // --- SINCRONIZACIÓN CON LA API DE TRANSCRIPCIÓN ---
  useEffect(() => {
    const handleStateChange = (newState: 'recording' | 'stopped' | 'idle') => {
      setIsRecording(newState === 'recording');
    };
    const handleTextUpdate = (newText: string) => {
      setTranscription(newText);
    };

    const unsubState = onStateChange(handleStateChange);
    const unsubText = onTranscriptionUpdate(handleTextUpdate);

    return () => {
      unsubState();
      unsubText();
    };
  }, [setIsRecording, setTranscription]);
  
  // --- MANEJO DE COMANDOS DE VOZ ---
  const executeCommand = useCallback((command: string) => {
    // Eliminar espacios y convertir a minúsculas
    const cleanedCommand = command.toLowerCase().replace(/\s+/g, '');
    
    const commandActions: { [key: string]: () => void } = {
      'iniciargrabación': () => startTranscription().catch(console.error),
      'detenergrabación': stopTranscription,
      'activarpizarra': () => setIsDrawingMode(true),
      'cerrarpizarra': () => setIsDrawingMode(false),
      'pizarraarriba': () => setPanelCommand('top'),
      'pizarraabajo': () => setPanelCommand('bottom'),
      'pizarraderecha': () => setPanelCommand('right'),
      'pizarraizquierda': () => setPanelCommand('left'),
      'pizarracentro': () => setPanelCommand('free'),
    };

    if (commandActions[cleanedCommand]) {
      commandActions[cleanedCommand]();
      // Resetea el comando del panel después de un corto tiempo
      if (['top', 'bottom', 'right', 'left', 'free'].some(c => cleanedCommand.includes(c))) {
        setTimeout(() => setPanelCommand(null), 100);
      }
    }
  }, []);

  useEffect(() => {
    // Registrar la función que maneja los comandos
    registerCommands(executeCommand);
  }, [executeCommand]);


  // --- MANEJO DE FUNCIONALIDADES DE LA UI ---
  const handleClearCanvas = () => {
    setClearCanvas(true);
    setTimeout(() => setClearCanvas(false), 50);
  };

  const handleExtractKeywords = () => {
    startTransition(async () => {
      if (!transcription || transcription.trim().length < 100) {
        setKeywords([]);
        setIsKeywordsDialogOpen(true);
        return;
      }
      const result = await extractKeywords(transcription);
      setKeywords(result);
      setIsKeywordsDialogOpen(true);
    });
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopTranscription();
    } else {
      startTranscription().catch(console.error);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Barra de Herramientas Principal */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-30 flex gap-2">
        <Link href="/">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Volver a la página principal</p></TooltipContent>
          </Tooltip>
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              aria-pressed={isDrawingMode}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Activar modo dibujo</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Activar/Desactivar Pizarra</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={handleToggleRecording}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span className="sr-only">{isRecording ? 'Detener' : 'Iniciar'} transcripción</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{isRecording ? 'Detener' : 'Iniciar'} Transcripción</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExtractKeywords}
              disabled={isPending}
            >
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              <span className="sr-only">Extraer conceptos clave</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Extraer Conceptos Clave de la Clase</p></TooltipContent>
        </Tooltip>
      </div>

      {isDrawingMode && (
        <>
          <DrawingToolbar
            onColorChange={setBrushColor}
            onClear={handleClearCanvas}
            onClose={() => setIsDrawingMode(false)}
            currentColor={brushColor}
          />
          <DrawingCanvas brushColor={brushColor} clear={clearCanvas} />
        </>
      )}

      {/* El div contenedor para el posicionamiento del panel */}
      <div className="relative w-full h-full pointer-events-none">
        <TranscriptionPanel command={panelCommand} />
      </div>


      {/* Diálogo de Conceptos Clave */}
      <Dialog open={isKeywordsDialogOpen} onOpenChange={setIsKeywordsDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Conceptos Clave de la Clase</DialogTitle>
            <DialogDescription>
              Estos son los temas principales identificados por la IA en la transcripción.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow min-h-0">
            <ScrollArea className="h-full w-full rounded-md border p-4">
              {isPending ? (
                 <div className="flex items-center justify-center h-full">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                 </div>
              ) : keywords.length > 0 ? (
                <ul className="space-y-4">
                  {keywords.map((kw) => (
                    <li key={kw.keyword} className="flex gap-4 items-start">
                        <span className="text-2xl mt-1">{kw.emoji}</span>
                        <div>
                            <h3 className="font-semibold text-base text-primary">{kw.keyword}</h3>
                            <p className="text-sm text-muted-foreground">{kw.explanation}</p>
                        </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center mt-8">
                  No hay suficiente texto para extraer conceptos clave. La transcripción debe tener al menos 100 caracteres.
                </p>
              )}
            </ScrollArea>
          </div>
          <DialogFooter className="sm:justify-end mt-4">
            <Button onClick={() => setIsKeywordsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
