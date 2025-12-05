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
  Copy,
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
import { hostSession, sendToPeers, onPeerStatusChange } from '@/lib/p2p';
import { useToast } from '@/hooks/use-toast';

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
  
  const { setTranscription, isRecording, setIsRecording } = useTranscription();
  
  const [panelCommand, setPanelCommand] = useState<Command>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(0);

  const { toast } = useToast();

  // --- SINCRONIZACIÓN P2P ---
  useEffect(() => {
    const peerId = hostSession();
    setSessionId(peerId);

    const unsubPeers = onPeerStatusChange((count) => {
      setPeerCount(count);
    });
    
    return () => {
      unsubPeers();
    }
  }, []);


  // --- SINCRONIZACIÓN CON LA API DE TRANSCRIPCIÓN ---
  useEffect(() => {
    const handleStateChange = (newState: 'recording' | 'stopped' | 'idle') => {
      setIsRecording(newState === 'recording');
    };

    const handleTextUpdate = (newText: string, isFinal: boolean) => {
      // Envía el texto a los alumnos
      sendToPeers({ type: isFinal ? 'full_text' : 'interim_text', text: newText });
      
      // Actualiza la UI local del profesor
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
      if (['top', 'bottom', 'right', 'left', 'free'].some(c => cleanedCommand.includes(c))) {
        setTimeout(() => setPanelCommand(null), 100);
      }
    }
  }, []);

  useEffect(() => {
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
  
  const handleCopySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      toast({
        title: "ID de la Sala Copiado",
        description: "Ahora puedes compartirlo con tus alumnos.",
      });
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Barra de ID de Sala */}
      {sessionId && (
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-30">
          <div className="flex items-center gap-2 bg-card p-2 rounded-lg shadow-lg border">
            <span className="text-sm font-medium text-muted-foreground">ID de la Sala:</span>
            <span className="font-mono text-sm text-primary">{sessionId}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopySessionId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar ID de la sala</TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1">
            Alumnos conectados: {peerCount}
          </p>
        </div>
      )}

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
    </div>
  );
}