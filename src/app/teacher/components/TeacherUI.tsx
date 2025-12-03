'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff } from 'lucide-react';
import { useTranscription } from '@/hooks/use-transcription';
import {
  startTranscription,
  stopTranscription,
  registerCommands,
  onStateChange,
  onTranscriptionUpdate
} from '@/lib/transcription';
import { DrawingCanvas } from './DrawingCanvas';
import { TranscriptionPanel, Command } from './TranscriptionPanel';

interface TeacherUIProps {
  isDrawingMode: boolean;
  brushColor: string;
  clearCanvas: boolean;
  Toolbar: React.ReactNode;
}

export default function TeacherUI({
  isDrawingMode,
  brushColor,
  clearCanvas,
  Toolbar,
}: TeacherUIProps) {
  const { isRecording, setIsRecording, setTranscription } = useTranscription();
  const [panelCommand, setPanelCommand] = useState<Command | null>(null);

  // Efecto para sincronizar el estado del hook con el estado real de la API
  useEffect(() => {
    const handleStateChange = (newState: 'recording' | 'stopped' | 'idle') => {
      setIsRecording(newState === 'recording');
    };
    const handleTextChange = (newText: string) => {
      setTranscription(newText);
    };

    const unsubState = onStateChange(handleStateChange);
    const unsubText = onTranscriptionUpdate(handleTextChange);

    return () => {
      unsubState();
      unsubText();
    };
  }, [setIsRecording, setTranscription]);
  

  const handleCommand = useCallback((command: Command) => {
    setPanelCommand(command);
    // El setTimeout aquí es seguro porque está en un callback manejado por evento
    setTimeout(() => setPanelCommand(null), 100);
  }, []);

  const handleStartRecording = useCallback(() => {
    startTranscription().catch(err => {
      console.error("Error al iniciar la grabación:", err);
    });
  }, []);

  const handleStopRecording = useCallback(() => {
    stopTranscription();
  }, []);
  
  // Usamos useMemo para definir los comandos solo una vez
  const commands = useMemo(() => ({
      'iniciargrabación': handleStartRecording,
      'detenergrabación': handleStopRecording,
      'activarpizarra': () => {
          // Necesitaríamos pasar la función para cambiar el estado de la pizarra
          // Por ahora, lo dejamos como un log para demostrar que funciona
          console.log("Comando: Activar Pizarra");
      },
      'cerrarpizarra': () => console.log("Comando: Cerrar Pizarra"),
      'pizarraarriba': () => handleCommand('top'),
      'pizarraabajo': () => handleCommand('bottom'),
      'pizarraderecha': () => handleCommand('right'),
      'pizarraizquierda': () => handleCommand('left'),
      'pizarracentro': () => handleCommand('free'),
    }), [handleStartRecording, handleStopRecording, handleCommand]);

  // useEffect para registrar los comandos
  useEffect(() => {
    registerCommands(commands);
  }, [commands]);


  return (
    <>
      {Toolbar}
      
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
