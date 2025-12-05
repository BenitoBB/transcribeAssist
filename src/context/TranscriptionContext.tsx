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

import {
  startWhisperWasm,
  stopWhisperWasm,
} from '../lib/transcription/whisper-wasm';

import {
  startServerTranscription,
  stopServerTranscription,
} from '../lib/transcription/server-proxy';

import type { TranscriptionModel } from '@/lib/models-config';

export type { TranscriptionModel };

export interface TranscriptionContextType {
  transcription: string;
  isRecording: boolean;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    setTranscription('');

    try {
      if (transcriptionModel === 'web-speech-api') {
        await startWebSpeechApi(handleTranscriptionUpdate);
      } else if (transcriptionModel === 'whisper-wasm') {
        await startWhisperWasm(handleTranscriptionUpdate);
      } else {
        await startServerTranscription(transcriptionModel, handleTranscriptionUpdate);
      }
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'Error desconocido al iniciar grabación.';
      setTranscription(`Error: ${errorMessage}`);
      setIsRecording(false);
    } finally {
      setIsLoading(false);
    }
  }, [handleTranscriptionUpdate, transcriptionModel]);

  const stopRecording = useCallback(() => {
    try {
      if (transcriptionModel === 'web-speech-api') {
        stopWebSpeechApi();
      } else if (transcriptionModel === 'whisper-wasm') {
        stopWhisperWasm();
      } else {
        stopServerTranscription();
      }
    } catch (e) {
      console.error('Error al detener la grabación:', e);
    } finally {
      setIsRecording(false);
    }
  }, [transcriptionModel]);

  const value = {
    isRecording,
    isLoading,
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
