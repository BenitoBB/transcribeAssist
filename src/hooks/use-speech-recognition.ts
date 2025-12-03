'use client';

import { useRef, useCallback } from 'react';

interface SpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onStateChange: (isListening: boolean) => void;
  continuous?: boolean;
}

const SpeechRecognition =
  (typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
  null;

export const useSpeechRecognition = ({
  onResult,
  onStateChange,
  continuous = true,
}: SpeechRecognitionOptions) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isStoppingRef = useRef(false);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      isStoppingRef.current = true;
      recognitionRef.current.stop();
    }
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      console.error('Speech Recognition API no es soportada en este navegador.');
      return;
    }

    if (recognitionRef.current) {
      // Si ya existe una instancia, no hagas nada.
      return;
    }
    
    isStoppingRef.current = false;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'es-ES';
    recognition.interimResults = !continuous;
    recognition.continuous = continuous;

    recognition.onstart = () => {
      onStateChange(true);
    };

    recognition.onend = () => {
      onStateChange(false);
      recognitionRef.current = null;
      // Si no es continuo y no se detuvo manualmente, reinicia para la siguiente escucha.
      if (!continuous && !isStoppingRef.current) {
        start();
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Error en Speech Recognition:', event.error);
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript.trim().toLowerCase());
      }
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        try {
          recognition.start();
        } catch (e) {
          // A veces puede lanzar error si ya empezó, lo ignoramos.
        }
      })
      .catch((err) => {
        console.error('Error al acceder al micrófono:', err);
      });

  }, [continuous, onResult, onStateChange]);

  return { start, stop };
};
