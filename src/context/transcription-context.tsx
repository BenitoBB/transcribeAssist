'use client';
import { useWhisperTranscription } from '@/hooks/use-whisper-transcription';
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useApp } from './app-context';

interface TranscriptionContextType {
    transcript: string;
    isTranscribing: boolean;
    startTranscription: () => void;
    stopTranscription: () => void;
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

export function TranscriptionProvider({ children }: { children: ReactNode }) {
    const { role, dataChannel } = useApp();
    const { 
        transcript, 
        setTranscript, 
        isTranscribing, 
        startTranscription, 
        stopTranscription 
    } = useWhisperTranscription();

    // Effect for teacher to send transcript
    useEffect(() => {
        if (role === 'teacher' && dataChannel && dataChannel.readyState === 'open' && transcript) {
            // Send only the latest part of the transcript
            dataChannel.send(transcript);
        }
    }, [transcript, role, dataChannel]);

    // Effect for student to receive transcript
    useEffect(() => {
        if (role === 'student' && dataChannel) {
            dataChannel.onmessage = (event) => {
                // Student receives the full transcript every time
                setTranscript(event.data);
            };
        }
    }, [role, dataChannel, setTranscript]);


    const value = {
        transcript,
        isTranscribing,
        startTranscription: role === 'teacher' ? startTranscription : () => {},
        stopTranscription: role === 'teacher' ? stopTranscription : () => {},
    };

    return (
        <TranscriptionContext.Provider value={value}>
            {children}
        </TranscriptionContext.Provider>
    );
}

export function useTranscription() {
    const context = useContext(TranscriptionContext);
    if (context === undefined) {
        throw new Error('useTranscription must be used within a TranscriptionProvider');
    }
    return context;
}
