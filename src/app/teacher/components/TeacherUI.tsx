'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff } from 'lucide-react';
import { useTranscription } from '@/hooks/use-transcription';
import { useTranscriptionClient } from '@/hooks/use-transcription-client';
import {
  startTranscription,
  stopTranscription,
  registerCommands,
} from '@/lib/transcription';
import { DrawingCanvas } from './DrawingCanvas';
import { TranscriptionPanel, Command } from './TranscriptionPanel';

interface TeacherUIProps {
  isDrawingMode: boolean;
  brushColor: string;
  clearCanvas: boolean;
}

export default function TeacherUI({
  isDrawingMode,
  brushColor,
  clearCanvas,
}: TeacherUIProps) {
  // Conecta el estado global de React con la lógica de transcripción del navegador
  useTranscriptionClient();
  const { isRecording } = useTranscription();
  const [panelCommand, setPanelCommand] = useState<Command | null>(null);

  const handleCommand = useCallback((command: Command) => {
    setPanelCommand(command);
    setTimeout(() => setPanelCommand(null), 100);
  }, []);

  const handleStartRecording = useCallback(() => {
    startTranscription().catch(err => {
      console.error("Error al iniciar la grabación desde el botón:", err);
      // Opcional: mostrar un toast de error al usuario
    });
  }, []);

  const handleStopRecording = useCallback(() => {
    stopTranscription();
  }, []);

  useEffect(() => {
    const commands = {
      'iniciargrabación': handleStartRecording,
      'detenergrabación': handleStopRecording,
      // Los comandos de la pizarra y el panel siguen funcionando igual
      'pizarraarriba': () => handleCommand('top'),
      'pizarraabajo': () => handleCommand('bottom'),
      'pizarraderecha': () => handleCommand('right'),
      'pizarraizquierda': () => handleCommand('left'),
      'pizarracentro': () => handleCommand('free'),
    };
    registerCommands(commands);
  }, [handleStartRecording, handleStopRecording, handleCommand]);

  return (
    <>
      {isDrawingMode && (
        <DrawingCanvas brushColor={brushColor} clear={clearCanvas} />
      )}

      {/* Botones de control de grabación */}
      <div className="absolute top-4 left-[10.5rem] sm:top-8 sm:left-[10.5rem] z-30 flex gap-2">
        {!isRecording ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleStartRecording}>
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
                onClick={handleStopRecording}
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

      <div className="relative p-4 h-full w-full pointer-events-none">
        <TranscriptionPanel command={panelCommand} />
      </div>
    </>
  );
}
