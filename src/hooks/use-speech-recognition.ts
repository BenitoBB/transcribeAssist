"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): ISpeechRecognition };
    webkitSpeechRecognition: { new (): ISpeechRecognition };
  }
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const listeningRef = useRef(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startListening = useCallback(() => {
    if (recognitionRef.current && !listeningRef.current) {
      setTranscript('');
      finalTranscriptRef.current = '';
      setError(null);
      try {
        recognitionRef.current.start();
        listeningRef.current = true;
        setIsListening(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        listeningRef.current = false;
        setIsListening(false);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    if (recognitionRef.current && listeningRef.current) {
      listeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Web Speech API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      listeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        // The service ended, but we want to keep listening.
        // We use a small timeout to avoid a potential race condition
        // where the service stops and starts too quickly.
        timeoutRef.current = setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (err) {
            console.error("Error restarting speech recognition:", err);
            listeningRef.current = false;
            setIsListening(false);
          }
        }, 100);
      } else {
        // If it ended and we didn't want to listen anymore, ensure UI is up to date
        setIsListening(false);
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
      if(timeoutRef.current) clearTimeout(timeoutRef.current);
      if(recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        if(listeningRef.current) {
           recognitionRef.current.stop();
        }
        recognitionRef.current = null;
      }
      listeningRef.current = false;
      setIsListening(false);
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    setTranscript,
    hasRecognitionSupport: !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)),
  };
};
