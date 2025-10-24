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
        transcript: newTranscriptChunk, 
        isTranscribing, 
        startTranscription, 
        stopTranscription,
        fullTranscript
    } = useWhisperTranscription();
    
    const [studentTranscript, setStudentTranscript] = useState('');

    useEffect(() => {
        if (role === 'teacher' && dataChannel && dataChannel.readyState === 'open' && newTranscriptChunk) {
            // Send only the latest chunk
            const fullSentText = newTranscriptChunk;
            const lastChunk = fullSentText.replace(fullTranscript, '');
            if(lastChunk) {
                dataChannel.send(lastChunk);
            }
        }
    }, [newTranscriptChunk, role, dataChannel, fullTranscript]);
    
    useEffect(() => {
        if (role === 'teacher' && dataChannel && dataChannel.readyState === 'open' && fullTranscript) {
            dataChannel.send(fullTranscript);
        }
    }, [fullTranscript, role, dataChannel]);

    useEffect(() => {
        if (role === 'student' && dataChannel) {
            const handleMessage = (event: MessageEvent) => {
                setStudentTranscript(prev => prev + event.data);
            };
            dataChannel.addEventListener('message', handleMessage);

            return () => {
                dataChannel.removeEventListener('message', handleMessage);
            }
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
