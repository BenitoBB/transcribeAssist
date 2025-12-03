'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Pencil,
  Mic,
  MicOff,
  Sparkles,
  LoaderCircle
} from 'lucide-react';
import { DrawingToolbar } from './components/DrawingToolbar';
import { useTranscription } from '@/hooks/use-transcription';
import { Command } from './components/TranscriptionPanel';
import {
  startTranscription,
  stopTranscription,
  registerCommands,
  onStateChange,
  onTranscriptionUpdate,
} from '@/lib/transcription';
import { SummaryDialog } from './components/SummaryDialog';
import { summarizeText } from '@/ai/flows/summarize-text-flow';


// Carga dinámica de componentes que solo funcionan en el cliente
const DrawingCanvas = dynamic(
  () => import('./components/DrawingCanvas').then(mod => mod.DrawingCanvas),
  { ssr: false }
);

const TranscriptionPanel = dynamic(
  () => import('./components/TranscriptionPanel').then(mod => mod.TranscriptionPanel),
  { ssr: false }
);

export default function TeacherPage() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [clearCanvas, setClearCanvas] = useState(false);
  
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const { transcription, setTranscription, isRecording, setIsRecording } = useTranscription();
  
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

  const handleToggleRecording = () => {
    if (isRecording) {
      stopTranscription();
    } else {
      startTranscription().catch(console.error);
    }
  };

  const handleGenerateSummary = async () => {
    if (!transcription || isSummarizing) return;
    setIsSummarizing(true);
    setSummary('');
    setShowSummaryDialog(true);
    try {
      const result = await summarizeText(transcription);
      setSummary(result);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('No se pudo generar el resumen. Inténtalo de nuevo.');
    } finally {
      setIsSummarizing(false);
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
              onClick={handleGenerateSummary}
              disabled={isSummarizing}
            >
              {isSummarizing ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="sr-only">Generar resumen con IA</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Generar Resumen con IA</p></TooltipContent>
        </Tooltip>
      </div>
      
      <SummaryDialog
        summary={summary}
        isLoading={isSummarizing}
        open={showSummaryDialog}
        onOpenChange={setShowSummaryDialog}
      />


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
    </div>
  );
}
