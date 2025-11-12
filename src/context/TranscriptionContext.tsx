'use client';

import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import {
  startTranscription,
  stopTranscription,
  onTranscriptionUpdate,
} from '@/lib/transcription';
import { Keyword } from '@/ai/flows/extract-keywords-flow';

export interface TranscriptionContextType {
  transcription: string;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  keywords: Keyword[];
  setKeywords: React.Dispatch<React.SetStateAction<Keyword[]>>;
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
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  useEffect(() => {
    const handleTranscriptionUpdate = (newText: string) => {
      setTranscription(newText);
    };

    const unsubscribe = onTranscriptionUpdate(handleTranscriptionUpdate);

    return () => {
      unsubscribe();
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      await startTranscription();
      setIsRecording(true);
      setTranscription('Iniciando grabación... ');
      setKeywords([]);
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      setTranscription(
        'Error: No se pudo acceder al micrófono. Por favor, comprueba los permisos en tu navegador.'
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    stopTranscription();
    setIsRecording(false);
    // El texto final se actualizará a través del evento onTranscriptionUpdate
  }, []);

  const value = {
    isRecording,
    transcription,
    startRecording,
    stopRecording,
    keywords,
    setKeywords,
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
};
