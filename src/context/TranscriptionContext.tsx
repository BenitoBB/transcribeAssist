'use client';

import React, { createContext, useState, useCallback, ReactNode } from 'react';
import {
  startTranscription as startTranscriptionService,
  stopTranscription as stopTranscriptionService,
} from '@/lib/transcription';

// Define la forma del contexto
export interface TranscriptionContextType {
  transcription: string;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

// Crea el Contexto con un valor por defecto
export const TranscriptionContext = createContext<TranscriptionContextType | undefined>(
  undefined
);

interface TranscriptionProviderProps {
  children: ReactNode;
}

// Crea el componente Proveedor
export const TranscriptionProvider: React.FC<TranscriptionProviderProps> = ({
  children,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState(
    'El texto de la transcripción aparecerá aquí...'
  );

  // En una implementación real, aquí recibirías los eventos del servicio de transcripción
  // y actualizarías el estado de `transcription`.
  // Por ejemplo, si usaras WebSockets:
  // useEffect(() => {
  //   const socket = new WebSocket('ws://tu-servidor-de-transcripcion');
  //   socket.onmessage = (event) => {
  //     const newTranscriptionText = JSON.parse(event.data).text;
  //     setTranscription(prev => prev + ' ' + newTranscriptionText);
  //   };
  //   return () => socket.close();
  // }, []);

  const startRecording = useCallback(async () => {
    try {
      const response = await startTranscriptionService();
      if (response.success) {
        setIsRecording(true);
        setTranscription('Grabando... '); // Limpia la transcripción anterior
      }
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      const response = await stopTranscriptionService();
      if (response.success) {
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error al detener la grabación:', error);
    }
  }, []);

  const value = {
    isRecording,
    transcription,
    startRecording,
    stopRecording,
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
};
