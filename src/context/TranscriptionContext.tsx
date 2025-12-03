'use client';

import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Keyword } from '@/ai/flows/extract-keywords-flow';

// Este estado es ahora puramente para la UI, la lógica real se carga dinámicamente.
export interface TranscriptionContextType {
  transcription: string;
  setTranscription: React.Dispatch<React.SetStateAction<string>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
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

  // Las funciones start/stop se eliminan de aquí, ya que ahora son
  // manejadas por el hook que se carga en el cliente.

  const value = {
    isRecording,
    setIsRecording,
    transcription,
    setTranscription,
    keywords,
    setKeywords,
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
};
