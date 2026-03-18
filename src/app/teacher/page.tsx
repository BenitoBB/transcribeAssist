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
  FileText,
  Play,
  X,
  Loader2,
} from 'lucide-react';
import { DrawingToolbar } from './components/DrawingToolbar';
import { useTranscription } from '@/hooks/use-transcription';
import { Command, Position } from './components/TranscriptionPanel';
import {
  startTranscription,
  stopTranscription,
  registerCommands,
  onStateChange,
  onTranscriptionUpdate,
} from '@/lib/transcription';
import { hostSession, sendToPeers, onPeerStatusChange, onConnectionStatusChange, ConnectionStatus } from '@/lib/p2p';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DEFAULT_TRANSCRIPTION_TEXT } from '@/context/TranscriptionContext';

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
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [currentTool, setCurrentTool] = useState<'pencil' | 'text' | 'eraser' | 'none'>('pencil');
  const [clearCanvas, setClearCanvas] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { transcription, setTranscription, isRecording, setIsRecording } = useTranscription();

  const [panelCommand, setPanelCommand] = useState<Command>(null);
  const [panelPosition, setPanelPosition] = useState<Position>('free');

  const [sessionId, setSessionId] = useState<string>('');
  const [peerCount, setPeerCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const { toast } = useToast();

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    // Generar el ID sincronamente, pero no mostrarlo como "listo" hasta conectar
    const peerId = hostSession();
    setSessionId(peerId);

    const unsubPeers = onPeerStatusChange((count) => {
      setPeerCount(count);
    });

    const unsubStatus = onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'error') {
        toast({
          variant: 'destructive',
          title: 'Error de servidor',
          description: 'No se pudo conectar al servidor de señalización. Revisa tu internet.',
        });
      }
    });

    return () => {
      unsubPeers();
      unsubStatus();
    }
  }, [toast]);

  useEffect(() => {
    const handleStateChange = (newState: 'recording' | 'stopped' | 'idle') => {
      setIsRecording(newState === 'recording');
      if (newState === 'recording') {
        sendToPeers({ type: 'recording_started', timestamp: new Date().toISOString() });
      }
    };

    // Transmitir siempre el texto completo para que el peer pueda decidir si pinta solo finales o no
    const handleTextUpdate = (newText: string, isFinal: boolean) => {
      sendToPeers({ type: 'full_text', text: newText });
      setTranscription(newText);
    };

    const unsubState = onStateChange(handleStateChange);
    const unsubText = onTranscriptionUpdate(handleTextUpdate);

    return () => {
      unsubState();
      unsubText();
    };
  }, [setIsRecording, setTranscription]);

  const executeCommand = useCallback((command: string) => {
    const cleanedCommand = command.toLowerCase().trim().replace(/[.,;:]/g, '');

    const commandActions: { [key: string]: () => void } = {
      'iniciar grabación': () => startTranscription().catch(console.error),
      'detener grabación': stopTranscription,
      'activar pizarra': () => setIsDrawingMode(true),
      'cerrar pizarra': () => setIsDrawingMode(false),
      'pizarra arriba': () => setPanelCommand('top'),
      'pizarra abajo': () => setPanelCommand('bottom'),
      'pizarra derecha': () => setPanelCommand('right'),
      'pizarra izquierda': () => setPanelCommand('left'),
      'pizarra centro': () => setPanelCommand('free'),
    };

    if (commandActions[cleanedCommand]) {
      commandActions[cleanedCommand]();
      if (['top', 'bottom', 'right', 'left', 'free'].some(c => cleanedCommand.includes(c))) {
        setTimeout(() => setPanelCommand(null), 100);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = registerCommands(executeCommand);
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [executeCommand]);

  const handleClearCanvas = () => {
    setClearCanvas(true);
    setTimeout(() => setClearCanvas(false), 50);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopTranscription();
    } else {
      startTranscription(false).catch(console.error);
    }
  };

  const handleContinueRecording = () => {
    startTranscription(true).catch(console.error);
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
      {isScreenshotMode ? (
        <div className="absolute top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-10 w-10 shadow-lg border-2" 
            onClick={() => setIsScreenshotMode(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Salir del modo captura</span>
          </Button>
        </div>
      ) : (
        <div className={cn(
          "absolute z-30 flex items-center gap-2 transition-all duration-300",
          {
            'top-4 left-4 sm:top-8 sm:left-8': panelPosition === 'free' || panelPosition === 'right' || panelPosition === 'bottom',
            'top-4 right-4 sm:top-8 sm:right-8': panelPosition === 'left',
            'bottom-4 left-4 sm:bottom-8 sm:left-8': panelPosition === 'top',
          }
        )}>
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
        {!isMobile && (
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
        )}
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

        {!isRecording && transcription !== '' && transcription !== DEFAULT_TRANSCRIPTION_TEXT && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleContinueRecording}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Play className="h-4 w-4" />
                <span className="sr-only">Continuar grabación</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Continuar Grabación</p></TooltipContent>
          </Tooltip>
        )}
        

      </div>
      )}

      {sessionId && !isScreenshotMode && (
        <div className={cn(
          "absolute z-30 flex flex-col transition-all duration-300",
          {
            'top-4 right-4 sm:top-8 sm:right-8 items-end': panelPosition === 'free' || panelPosition === 'left' || panelPosition === 'bottom',
            'top-4 left-4 sm:top-8 sm:left-8 items-start': panelPosition === 'right',
            'bottom-4 right-4 sm:bottom-8 sm:right-8 items-end': panelPosition === 'top',
          },
          isDrawingMode && (panelPosition === 'free' || panelPosition === 'left' || panelPosition === 'bottom') && "translate-y-20 sm:translate-y-24"
        )}>
          {connectionStatus === 'connecting' ? (
            <div className="flex items-center gap-2 bg-[#0F172A] text-white p-2.5 rounded-lg shadow-xl border border-white/10 animate-in fade-in zoom-in duration-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-semibold tracking-wide">Conectando...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-card/90 p-2 rounded-lg shadow-lg border backdrop-blur-sm">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">ID de Sala:</span>
                <span className="font-mono text-sm text-primary font-bold bg-muted px-2 py-0.5 rounded select-all">{sessionId}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopySessionId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5 bg-background/60 px-3 py-1 rounded-full mt-1.5 border backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Alumnos: <span className="text-primary">{peerCount}</span>
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {!isScreenshotMode && (
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:flex items-center gap-4 transition-all duration-300",
          panelPosition === 'top' ? 'bottom-8' : 'top-8',
          // Ocultar el título en el rango de 771px a 1168px (aprox) para evitar solapamientos
          // Solo mostrarlo desplazado en pantallas ultra-grandes (+1200px)
          isDrawingMode && "opacity-0 invisible min-[1200px]:opacity-100 min-[1200px]:visible min-[1200px]:-translate-x-[350px]"
        )}>
          <h1 className="text-3xl font-bold bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm whitespace-nowrap">
            Vista del Maestro
          </h1>
        </div>
      )}

      {!isMobile && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-5">
          <DrawingCanvas 
            brushColor={brushColor} 
            tool={currentTool}
            clear={clearCanvas} 
            isActive={isDrawingMode}
          />
        </div>
      )}

      {!isMobile && isDrawingMode && !isScreenshotMode && (
        <DrawingToolbar
          onColorChange={setBrushColor}
          onToolChange={(tool) => {
            if (currentTool === tool) {
              setCurrentTool('none');
            } else {
              setCurrentTool(tool);
            }
          }}
          onClear={handleClearCanvas}
          onSnapshotMode={() => setIsScreenshotMode(true)}
          onClose={() => setIsDrawingMode(false)}
          currentColor={brushColor}
          currentTool={currentTool}
        />
      )}

      {!isScreenshotMode && (
        <div className="relative w-full h-full pointer-events-none z-10">
          <TranscriptionPanel 
            command={panelCommand} 
            onPositionChange={setPanelPosition} 
            sessionId={sessionId}
          />
        </div>
      )}

    </div>
  );
}