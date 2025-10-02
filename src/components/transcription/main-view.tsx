"use client";

import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { TranscriptionEditor } from './transcription-editor';
import { TranscriptionControls } from './transcription-controls';
import { SessionSidebar } from './session-sidebar';
import type { TranscriptionSession } from '@/app/types';
import { useToast } from '@/hooks/use-toast';
import { identifySpeakers } from '@/ai/flows/identify-speakers';
import { summarizeLecture } from '@/ai/flows/summarize-lecture';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function MainView() {
  const [activeSession, setActiveSession] = useState<TranscriptionSession | null>(null);
  const [sessions, setSessions] = useState<TranscriptionSession[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');

  const { toast } = useToast();
  const {
    transcript,
    setTranscript,
    startListening,
    stopListening,
    isListening,
    error,
    hasRecognitionSupport
  } = useSpeechRecognition();

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Speech Recognition Error',
        description: error,
      });
    }
  }, [error, toast]);
  
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('transcription-sessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
    } catch (e) {
      console.error("Failed to load sessions from local storage", e);
    }
  }, []);

  useEffect(() => {
    if (isListening) {
      setCurrentContent(transcript);
    }
  }, [transcript, isListening]);
  
  const handleStart = () => {
    const newSession: TranscriptionSession = {
      id: Date.now().toString(),
      title: `New Lecture - ${new Date().toLocaleString()}`,
      date: new Date().toISOString(),
      content: '',
      notes: [],
    };
    setActiveSession(newSession);
    setCurrentContent('');
    setTranscript('');
    startListening();
  };

  const handleStop = () => {
    stopListening();
    if(activeSession) {
        setActiveSession(prev => prev ? {...prev, content: transcript} : null);
        setCurrentContent(transcript);
        setShowSaveDialog(true);
        setSessionTitle(`Lecture - ${new Date().toLocaleDateString()}`);
    }
  };

  const handleSaveSession = () => {
    if (!activeSession) return;
    
    const finalSession: TranscriptionSession = {
      ...activeSession,
      title: sessionTitle || activeSession.title,
      content: transcript,
    };
    
    setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === finalSession.id);
        let newSessions;
        if(existingIndex > -1) {
            newSessions = [...prev];
            newSessions[existingIndex] = finalSession;
        } else {
            newSessions = [finalSession, ...prev];
        }
        try {
            localStorage.setItem('transcription-sessions', JSON.stringify(newSessions));
        } catch(e) {
            console.error("Failed to save sessions to local storage", e);
            toast({ variant: "destructive", title: "Could not save session" });
        }
        return newSessions;
    });

    setActiveSession(finalSession);
    setShowSaveDialog(false);
    setSessionTitle('');
    toast({ title: 'Session saved!', description: `"${finalSession.title}" has been archived.` });
  };
  
  const handleSelectSession = (session: TranscriptionSession) => {
    if (isListening) stopListening();
    setActiveSession(session);
    setCurrentContent(session.content);
    setTranscript(session.content);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId);
      try {
        localStorage.setItem('transcription-sessions', JSON.stringify(newSessions));
      } catch(e) { console.error(e); }
      return newSessions;
    });
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
      setCurrentContent('');
      setTranscript('');
    }
    toast({ title: 'Session deleted.' });
  };

  const handleIdentifySpeakers = async () => {
    const contentToProcess = activeSession?.content;
    if (!contentToProcess) return;

    setIsProcessingAI('speakers');
    try {
      const { identifiedTranscription } = await identifySpeakers({ transcription: contentToProcess });
      setCurrentContent(identifiedTranscription);
      if (activeSession) {
          setActiveSession({ ...activeSession, content: identifiedTranscription });
      }
      toast({ title: 'Speakers Identified!', description: 'Transcription updated with speaker labels.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'AI Error', description: 'Could not identify speakers.' });
    } finally {
      setIsProcessingAI(null);
    }
  };

  const handleSummarize = async () => {
    const contentToProcess = activeSession?.content;
    if (!contentToProcess) return;

    setIsProcessingAI('summary');
    try {
        const { summary } = await summarizeLecture({ transcription: contentToProcess });
        if (activeSession) {
            setActiveSession({ ...activeSession, summary });
        }
        toast({ title: 'Summary Generated!' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'AI Error', description: 'Could not generate summary.' });
    } finally {
        setIsProcessingAI(null);
    }
  };

  const updateContent = (newContent: string) => {
      setCurrentContent(newContent);
      if (activeSession && !isListening) {
          const newSession = {...activeSession, content: newContent};
          setActiveSession(newSession);
          setSessions(prev => {
              const newSessions = prev.map(s => s.id === newSession.id ? newSession : s);
              try {
                localStorage.setItem('transcription-sessions', JSON.stringify(newSessions));
              } catch(e) { console.error(e); }
              return newSessions;
          });
      }
  }

  return (
    <div className="container mx-auto grid h-full flex-1 grid-cols-1 gap-8 p-4 md:grid-cols-[320px_1fr]">
      <aside className="hidden md:block">
        <SessionSidebar 
          sessions={sessions}
          activeSessionId={activeSession?.id}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
        />
      </aside>
      <div className="relative flex min-h-[calc(100vh-8rem)] flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
        {isProcessingAI && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
            <span className="mt-2 font-semibold text-primary-foreground">AI is working its magic...</span>
            <span className="text-sm text-primary-foreground/80">
                {isProcessingAI === 'speakers' ? 'Identifying speakers...' : 'Generating summary...'}
            </span>
          </div>
        )}
        {!hasRecognitionSupport && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Browser Not Supported</AlertTitle>
            <AlertDescription>
              The speech recognition feature is not supported in your current browser. Please try Chrome or Edge.
            </AlertDescription>
          </Alert>
        )}
        <TranscriptionControls 
          isListening={isListening}
          onStart={handleStart}
          onStop={handleStop}
          onIdentifySpeakers={handleIdentifySpeakers}
          onSummarize={handleSummarize}
          isProcessingAI={!!isProcessingAI}
          hasActiveSession={!!activeSession}
          hasRecognitionSupport={hasRecognitionSupport}
        />
        <TranscriptionEditor
          key={activeSession?.id ?? 'no-session'}
          content={currentContent}
          onContentChange={updateContent}
          isReadOnly={isListening}
          session={activeSession}
        />
      </div>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Lecture Session</AlertDialogTitle>
            <AlertDialogDescription>
              Review the title for your transcribed lecture before saving it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
              <Label htmlFor="session-title">Session Title</Label>
              <Input
                id="session-title"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g., Biology 101 - Week 5"
              />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSaveDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveSession}>Save Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
