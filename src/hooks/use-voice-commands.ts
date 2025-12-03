'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Comprueba si la API de reconocimiento de voz está disponible en el objeto window
const SpeechRecognition =
  (typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
  null;

interface VoiceCommandOptions {
  isTranscriptionRecording: boolean;
  onListenStart?: () => void;
  onListenStop?: () => void;
}

/**
 * Hook para gestionar los comandos de voz.
 * @param onCommand - Callback que se ejecuta cuando se reconoce un comando.
 * @param options - Objeto con el estado de la grabación de transcripción y callbacks.
 */
export const useVoiceCommands = (
  onCommand: (command: string) => void,
  options: VoiceCommandOptions
) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wasRecordingRef = useRef(options.isTranscriptionRecording);
  const manualStopRef = useRef(false);

  // Actualiza la referencia al estado de grabación cuando cambia
  useEffect(() => {
    wasRecordingRef.current = options.isTranscriptionRecording;
  }, [options.isTranscriptionRecording]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      manualStopRef.current = true;
      recognitionRef.current.stop();
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      console.error('La API de reconocimiento de voz no es compatible con este navegador.');
      return;
    }
    
    // Si la transcripción principal está activa, la pausamos para dar paso a los comandos.
    if (wasRecordingRef.current) {
      options.onListenStart?.();
    }
    
    manualStopRef.current = false;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      // Si la transcripción estaba activa antes, la reanudamos.
      if (wasRecordingRef.current && !manualStopRef.current) {
        options.onListenStop?.();
      }
    };

    recognition.onerror = (event) => {
      if (!['no-speech', 'aborted'].includes(event.error)) {
        console.error('Error en el reconocimiento de voz para comandos:', event.error);
      }
    };

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.trim().toLowerCase();
      onCommand(command);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Error al iniciar el reconocimiento de comandos: ", e)
    }

  }, [onCommand, options]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return { isListening, toggleListening };
};
