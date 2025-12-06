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

import {
  summarizeText,
  extractKeywords,
  extractBulletPoints,
} from '@/lib/text-processing/summarizer';

import type { TranscriptionModel } from '@/lib/models-config';
import type { SummaryResult, KeywordsResult } from '@/lib/text-processing/summarizer';

export type { TranscriptionModel, SummaryResult, KeywordsResult };

export interface TranscriptionContextType {
  transcription: string;
  isRecording: boolean;
  isLoading: boolean;
  isSummarizing: boolean;
  summary: SummaryResult | null;
  keywords: KeywordsResult | null;
  bulletPoints: string[] | null;
  summaryError: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  generateSummary: () => Promise<void>;
  generateKeywords: () => Promise<void>;
  generateBulletPoints: () => Promise<void>;
  clearSummary: () => void;
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
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [transcription, setTranscription] = useState(
    'La transcripción de la clase aparecerá aquí cuando inicies la grabación...'
  );
  const [transcriptionModel, setTranscriptionModel] =
    useState<TranscriptionModel>('web-speech-api');
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [keywords, setKeywords] = useState<KeywordsResult | null>(null);
  const [bulletPoints, setBulletPoints] = useState<string[] | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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

  const stopRecording = useCallback(async () => {
    try {
      if (transcriptionModel === 'web-speech-api') {
        stopWebSpeechApi();
      } else if (transcriptionModel === 'whisper-wasm') {
        stopWhisperWasm();
      } else {
        await stopServerTranscription();
      }
    } catch (e) {
      console.error('Error al detener la grabación:', e);
    } finally {
      setIsRecording(false);
    }
  }, [transcriptionModel]);

  const generateSummary = useCallback(async () => {
    if (!transcription || transcription.includes('Error') || transcription.includes('aparecerá')) {
      setSummaryError('No hay transcripción disponible para resumir');
      return;
    }

    setIsSummarizing(true);
    setSummaryError(null);

    try {
      console.log('📝 Generando resumen...');
      const result = await summarizeText(transcription);
      setSummary(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setSummaryError(errorMsg);
      console.error('Error generando resumen:', error);
    } finally {
      setIsSummarizing(false);
    }
  }, [transcription]);

  const generateKeywords = useCallback(async () => {
    if (!transcription || transcription.includes('Error') || transcription.includes('aparecerá')) {
      setSummaryError('No hay transcripción disponible para extraer palabras clave');
      return;
    }

    setIsSummarizing(true);
    setSummaryError(null);

    try {
      console.log('🔍 Extrayendo palabras clave...');
      const result = await extractKeywords(transcription);
      setKeywords(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setSummaryError(errorMsg);
      console.error('Error extrayendo palabras clave:', error);
    } finally {
      setIsSummarizing(false);
    }
  }, [transcription]);

  const generateBulletPoints = useCallback(async () => {
    if (!transcription || transcription.includes('Error') || transcription.includes('aparecerá')) {
      setSummaryError('No hay transcripción disponible para generar puntos clave');
      return;
    }

    setIsSummarizing(true);
    setSummaryError(null);

    try {
      console.log('📌 Generando puntos clave...');
      const result = await extractBulletPoints(transcription);
      setBulletPoints(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setSummaryError(errorMsg);
      console.error('Error generando puntos clave:', error);
    } finally {
      setIsSummarizing(false);
    }
  }, [transcription]);

  const clearSummary = useCallback(() => {
    setSummary(null);
    setKeywords(null);
    setBulletPoints(null);
    setSummaryError(null);
  }, []);

  const value = {
    isRecording,
    isLoading,
    isSummarizing,
    transcription,
    startRecording,
    stopRecording,
    transcriptionModel,
    setTranscriptionModel,
    summary,
    keywords,
    bulletPoints,
    summaryError,
    generateSummary,
    generateKeywords,
    generateBulletPoints,
    clearSummary,
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
};
