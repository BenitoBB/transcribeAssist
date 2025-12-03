'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
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
import { ArrowLeft, Pencil, Mic, MicOff, Sparkles, LoaderCircle, Copy } from 'lucide-react';
import { TranscriptionPanel, Command } from './components/TranscriptionPanel';
import { DrawingCanvas } from './components/DrawingCanvas';
import { DrawingToolbar } from './components/DrawingToolbar';
import { useTranscription } from '@/hooks/use-transcription';
import { summarizeText } from '@/ai/flows/summarize-text-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { registerCommands } from '@/lib/transcription';


export default function TeacherPage() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [clearCanvas, setClearCanvas] = useState(false);
  const { isRecording, startRecording, stopRecording, transcription } = useTranscription();
  
  const [summary, setSummary] = useState('');
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [panelCommand, setPanelCommand] = useState<Command | null>(null);

  // Registrar los comandos de voz al montar el componente
  useEffect(() => {
    const commands = {
      iniciargrabación: () => {
        if (!isRecording) startRecording();
      },
      detenergrabación: () => {
        if (isRecording) stopRecording();
      },
      activarpizarra: () => setIsDrawingMode(true),
      cerrarpizarra: () => setIsDrawingMode(false),
      pizarraarriba: () => setPanelCommand('top'),
      pizarraabajo: () => setPanelCommand('bottom'),
      pizarraizquierda: () => setPanelCommand('left'),
      pizarraderecha: () => setPanelCommand('right'),
      pizarracentro: () => setPanelCommand('free'),
    };

    registerCommands(commands);

    // Resetear el comando del panel para que pueda ser llamado múltiples veces
    if (panelCommand) {
        const timer = setTimeout(() => setPanelCommand(null), 100);
        return () => clearTimeout(timer);
    }
  }, [isRecording, startRecording, stopRecording, panelCommand]);


  const handleClearCanvas = () => {
    setClearCanvas(true);
    setTimeout(() => setClearCanvas(false), 50);
  };

  const handleGenerateSummary = () => {
    startTransition(async () => {
      if (!transcription || transcription.startsWith('La transcripción')) {
        setSummary('No hay suficiente texto para generar un resumen.');
        setIsSummaryDialogOpen(true);
        return;
      }
      const result = await summarizeText(transcription);
      setSummary(result);
      setIsSummaryDialogOpen(true);
    });
  };

  const handleCopySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast({
        title: 'Copiado',
        description: 'El resumen ha sido copiado al portapapeles.',
      });
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {isDrawingMode && (
        <>
          <DrawingCanvas brushColor={brushColor} clear={clearCanvas} />
          <DrawingToolbar
            onColorChange={setBrushColor}
            onClear={handleClearCanvas}
            onClose={() => setIsDrawingMode(false)}
            currentColor={brushColor}
          />
        </>
      )}

      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-30 flex gap-2">
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
          <TooltipContent>
            <p>Activar/Desactivar Pizarra</p>
          </TooltipContent>
        </Tooltip>
        
        {!isRecording ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={startRecording}
              >
                <Mic className="h-4 w-4" />
                <span className="sr-only">Iniciar transcripción</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Iniciar Transcripción</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={stopRecording}
              >
                <MicOff className="h-4 w-4" />
                <span className="sr-only">Detener transcripción</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Detener Transcripción</p>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleGenerateSummary}
              disabled={isPending}
            >
              {isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="sr-only">Resumir transcripción</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generar Resumen de la Clase</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="relative p-4 h-full w-full pointer-events-none">
        <TranscriptionPanel command={panelCommand}/>
      </div>

      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Resumen de la Transcripción</DialogTitle>
            <DialogDescription>
              Este es un resumen de la clase generado por IA.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow min-h-0">
            <ScrollArea className="h-full w-full rounded-md border p-4">
              <p className="text-sm">{summary}</p>
            </ScrollArea>
          </div>
          <DialogFooter className="sm:justify-between mt-4">
            <Button variant="outline" onClick={handleCopySummary} disabled={!summary || summary.startsWith('No hay')}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button onClick={() => setIsSummaryDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
