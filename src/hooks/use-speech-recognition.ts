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

  const startListening = useCallback(() => {
    if (recognitionRef.current && !listeningRef.current) {
      setTranscript('');
      finalTranscriptRef.current = '';
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
        listeningRef.current = true;
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
      setIsListening(false);
      listeningRef.current = false;
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
      stopListening();
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch (err) {
          console.error("Error restarting speech recognition:", err);
          stopListening();
        }
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
      if(recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [stopListening]);

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
