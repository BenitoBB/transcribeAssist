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

export type TranscriptionModel =
  | 'web-speech-api'
  | 'whisper-wasm'
  | 'whisper-server'
  | 'whisper-translate'
  | 'vosk-server'
  | 'silero-server';

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
      if (transcriptionModel === 'web-speech-api') {
        await startWebSpeechApi(handleTranscriptionUpdate);
      } else if (transcriptionModel === 'whisper-wasm') {
        await startWhisperWasm(handleTranscriptionUpdate);
      } else {
        // modelos server-side: whisper-server, whisper-translate, vosk-server, silero-server
        await startServerTranscription(transcriptionModel, handleTranscriptionUpdate);
      }
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'Error desconocido al iniciar grabación.';
      setTranscription(`Error: ${errorMessage}`);
      setIsRecording(false);
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
