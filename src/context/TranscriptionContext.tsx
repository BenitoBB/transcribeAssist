'use client';

import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  startWebSpeechApi,
  stopWebSpeechApi,
} from '@/lib/transcription/web-speech-api';

export type TranscriptionModel = 'web-speech-api';

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

  const handleTranscriptionUpdate = useCallback((newText: string) => {
    setTranscription(newText);
  }, []);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
    setTranscription('');

    try {
      // Por ahora, solo usamos Web Speech API
      await startWebSpeechApi(handleTranscriptionUpdate);
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'Error desconocido al iniciar grabación.';
      setTranscription(`Error: ${errorMessage}`);
      setIsRecording(false);
    }
  }, [handleTranscriptionUpdate]);

  const stopRecording = useCallback(() => {
    // Por ahora, solo usamos Web Speech API
    stopWebSpeechApi();
    setIsRecording(false);
  }, []);

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
