'use client';

import { useState, useTransition } from 'react';
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
  Sparkles,
  LoaderCircle,
  Copy,
} from 'lucide-react';
import { DrawingToolbar } from './components/DrawingToolbar';
import { summarizeText } from '@/ai/flows/summarize-text-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useTranscription } from '@/hooks/use-transcription';

// Carga dinámica del componente que contiene TODA la lógica del cliente
const TeacherUIWithNoSSR = dynamic(() => import('./components/TeacherUI'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen w-screen"><LoaderCircle className="h-8 w-8 animate-spin" /></div>,
});

export default function TeacherPage() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [clearCanvas, setClearCanvas] = useState(false);
  const { transcription } = useTranscription();

  const [summary, setSummary] = useState('');
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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
        <DrawingToolbar
          onColorChange={setBrushColor}
          onClear={handleClearCanvas}
          onClose={() => setIsDrawingMode(false)}
          currentColor={brushColor}
        />
      )}

      {/* La barra de herramientas principal se pasa como prop a TeacherUI */}
      <TeacherUIWithNoSSR 
        isDrawingMode={isDrawingMode} 
        brushColor={brushColor} 
        clearCanvas={clearCanvas}
        Toolbar={
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
        }
      />

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
            <Button
              variant="outline"
              onClick={handleCopySummary}
              disabled={!summary || summary.startsWith('No hay')}
            >
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
