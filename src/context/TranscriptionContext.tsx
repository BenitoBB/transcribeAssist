'use client';

import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import {
  startWebSpeechApi,
  stopWebSpeechApi,
} from '@/lib/transcription/web-speech-api';
import {
  startGoogleApi,
  stopGoogleApi,
} from '@/lib/transcription/google-api';

export type TranscriptionModel = 'web-speech-api' | 'google';

export interface TranscriptionContextType {
  transcription: string;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  transcriptionModel: TranscriptionModel;
  setTranscriptionModel: React.Dispatch<React.SetStateAction<TranscriptionModel>>;
}

export const TranscriptionContext = createContext<
  TranscriptionContextType | undefined
>(undefined);

interface TranscriptionProviderProps {
  children: ReactNode;
}

export const TranscriptionProvider: React.FC<TranscriptionProviderProps> = ({
  children,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState(
    'La transcripción de la clase aparecerá aquí cuando inicies la grabación...'
  );
  const [transcriptionModel, setTranscriptionModel] =
    useState<TranscriptionModel>('web-speech-api');

  // Usamos una ref para tener siempre el valor más reciente de la transcripción en los callbacks
  const transcriptionRef = useRef(transcription);
  useEffect(() => {
    transcriptionRef.current = transcription;
  }, [transcription]);

  const handleTranscriptionUpdate = useCallback((newText: string, isFinal: boolean) => {
    if (isFinal) {
      // Cuando es final, reemplazamos la transcripción actual
      setTranscription(newText);
    } else {
      // Cuando es provisional, la añadimos al final.
      // Esto funciona mejor para los modelos de servidor que envían trozos completos.
      // Buscamos si el texto base ya existe para evitar duplicados.
      const baseText = transcriptionRef.current.endsWith('...') 
        ? transcriptionRef.current.slice(0, -3) 
        : transcriptionRef.current;
      setTranscription(baseText + newText);
    }
  }, []);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
    setTranscription('Iniciando grabación... ');

    try {
      if (transcriptionModel === 'web-speech-api') {
        await startWebSpeechApi(handleTranscriptionUpdate);
      } else {
        await startGoogleApi(handleTranscriptionUpdate);
      }
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'Error desconocido al iniciar grabación.';
      setTranscription(`Error: ${errorMessage}`);
      setIsRecording(false);
    }
  }, [transcriptionModel, handleTranscriptionUpdate]);

  const stopRecording = useCallback(() => {
    if (transcriptionModel === 'web-speech-api') {
      stopWebSpeechApi();
    } else {
      stopGoogleApi();
    }
    setIsRecording(false);
  }, [transcriptionModel]);

  const value = {
    isRecording,
    transcription,
    startRecording,
    stopRecording,
    transcriptionModel,
    setTranscriptionModel,
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
};
