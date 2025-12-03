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
  KeyRound,
} from 'lucide-react';
import { DrawingToolbar } from './components/DrawingToolbar';
import { extractKeywords, Keyword } from '@/ai/flows/extract-keywords-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useTranscription } from '@/hooks/use-transcription';
import { Badge } from '@/components/ui/badge';


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

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isKeywordsDialogOpen, setIsKeywordsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
                    onClick={handleExtractKeywords}
                    disabled={isPending}
                    >
                    {isPending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                        <KeyRound className="h-4 w-4" />
                    )}
                    <span className="sr-only">Extraer conceptos clave</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Extraer Conceptos Clave de la Clase</p>
                </TooltipContent>
                </Tooltip>
            </div>
        }
      />

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
