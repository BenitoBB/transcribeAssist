'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowLeft, Pencil, Mic, MicOff } from 'lucide-react';
import { TranscriptionPanel } from './components/TranscriptionPanel';
import { DrawingCanvas } from './components/DrawingCanvas';
import { DrawingToolbar } from './components/DrawingToolbar';
import { useTranscription } from '@/hooks/use-transcription';

export default function TeacherPage() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000'); // Color por defecto: rojo
  const [clearCanvas, setClearCanvas] = useState(false);
  const { isRecording, startRecording, stopRecording } = useTranscription();

  const handleClearCanvas = () => {
    setClearCanvas(true);
    // Reseteamos el estado para poder volver a limpiar en el futuro
    setTimeout(() => setClearCanvas(false), 50);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Funcionalidad de Dibujo - Renderizado primero para estar detrás */}
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
      </div>

      {/* Contenido principal */}
      <div className="relative p-4 h-full w-full z-10 pointer-events-none">
        <div className="text-center text-foreground">
          <h1 className="text-2xl sm:text-3xl font-bold">Vista del Maestro</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Aquí puedes mover y redimensionar el panel de transcripción.
          </p>
        </div>
        <TranscriptionPanel />
      </div>

    </div>
  );
}
