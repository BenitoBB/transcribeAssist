'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useWhisperTranscription } from '@/hooks/use-whisper-transcription';

export type Role = 'teacher' | 'student';

interface AppContextType {
  role: Role | null;
  setRole: (role: Role) => void;
  sessionId: string | null;
  setSessionId: (id: string, role: Role) => void;
  transcript: string;
  isTranscribing: boolean;
  startTranscription: () => void;
  stopTranscription: () => void;
  isPeerConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const { toast } = useToast();

  const {
    transcript,
    isTranscribing,
    startTranscription: startWhisper,
    stopTranscription: stopWhisper,
    setTranscript,
  } = useWhisperTranscription();

  const setRole = (role: Role) => {
    setRoleState(role);
  };
  
  const setSessionId = (id: string, role: Role) => {
    setSessionIdState(id);
  }

  const startTranscription = () => {
    // In a real implementation, we would send the transcript through WebRTC.
    startWhisper();
  };

  const stopTranscription = () => {
    stopWhisper();
  };

  const value = {
    role,
    setRole,
    sessionId,
    setSessionId,
    transcript,
    isTranscribing,
    startTranscription,
    stopTranscription,
    isPeerConnected
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
