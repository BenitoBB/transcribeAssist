'use client';

import React, {
  createContext,
  useState,
  ReactNode,
} from 'react';

export interface TranscriptionContextType {
  transcription: string;
  setTranscription: React.Dispatch<React.SetStateAction<string>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
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
    'Inicia una grabación o conéctate a una sala para ver la transcripción.'
  );

  const value = {
    isRecording,
    setIsRecording,
    transcription,
    setTranscription,
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
};