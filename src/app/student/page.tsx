'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowLeft, Pencil, Mic, MicOff, BookText } from 'lucide-react';
import { TranscriptionPanel } from '@/app/teacher/components/TranscriptionPanel';
import { DrawingCanvas } from '@/app/teacher/components/DrawingCanvas';
import { DrawingToolbar } from '@/app/teacher/components/DrawingToolbar';
import { useTranscription } from '@/hooks/use-transcription';
import { SummaryPanel } from '@/components/summary/SummaryPanel';

export default function StudentPage() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [clearCanvas, setClearCanvas] = useState(false);
  const { isRecording, startRecording, stopRecording, transcription } =
    useTranscription();
  const [isSummaryPanelOpen, setIsSummaryPanelOpen] = useState(false);

  const handleClearCanvas = () => {
    setClearCanvas(true);
    setTimeout(() => setClearCanvas(false), 50);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Paneles Flotantes */}
      {isSummaryPanelOpen && (
        <SummaryPanel
          textToSummarize={transcription}
          onClose={() => setIsSummaryPanelOpen(false)}
        />
      )}

      {/* Funcionalidad de Dibujo */}
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

      {/* Controles superiores */}
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
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleRecording}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isRecording
                  ? 'Detener transcripción'
                  : 'Iniciar transcripción'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isRecording ? 'Detener Transcripción' : 'Iniciar Transcripción'}
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSummaryPanelOpen(true)}
            >
              <BookText className="h-4 w-4" />
              <span className="sr-only">Generar resumen</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generar Resumen</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Contenido principal */}
      <div className="relative p-4 h-full w-full z-10 pointer-events-none">
        <TranscriptionPanel />
      </div>
    </div>
  );
}
