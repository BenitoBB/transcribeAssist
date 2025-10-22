'use client';
import { useWhisperTranscription } from '@/hooks/use-whisper-transcription';
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
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
        isTranscribing, 
        startTranscription, 
        stopTranscription,
        fullTranscript
    } = useWhisperTranscription();
    
    // Accumulate transcript for student from data channel
    const [studentTranscript, setStudentTranscript] = useState('');

    // Effect for teacher to send transcript
    useEffect(() => {
        if (role === 'teacher' && dataChannel && dataChannel.readyState === 'open' && transcript) {
            dataChannel.send(transcript);
        }
    }, [transcript, role, dataChannel]);

    // Effect for student to receive transcript
    useEffect(() => {
        if (role === 'student' && dataChannel) {
            dataChannel.onmessage = (event) => {
                setStudentTranscript(prev => prev + event.data);
            };
        }
    }, [role, dataChannel]);


    const value = {
        transcript: role === 'teacher' ? fullTranscript : studentTranscript,
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
