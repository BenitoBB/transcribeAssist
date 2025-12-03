'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechRecognition } from './use-speech-recognition';

interface VoiceCommandOptions {
  onListenStart?: () => void;
  onListenStop?: () => void;
}

/**
 * Hook para gestionar los comandos de voz.
 * @param onCommand - Callback que se ejecuta cuando se reconoce un comando.
 * @param wasRecording - Booleano para saber si la transcripción principal estaba activa.
 * @param options - Callbacks para pausar/reanudar la transcripción principal.
 */
export const useVoiceCommands = (
  onCommand: (command: string) => void,
  wasRecording: boolean,
  options?: VoiceCommandOptions
) => {
  const [isListening, setIsListening] = useState(false);
  const wasRecordingRef = useRef(wasRecording);

  useEffect(() => {
    wasRecordingRef.current = wasRecording;
  }, [wasRecording]);

  const handleResult = (transcript: string) => {
    onCommand(transcript);
  };

  const { start, stop } = useSpeechRecognition({
    onResult: handleResult,
    onStateChange: setIsListening,
    continuous: false, // Escucha un comando y se detiene
  });

  const toggleListening = useCallback(() => {
    if (isListening) {
      stop();
      // Si la transcripción principal estaba activa, la reanudamos.
      if (wasRecordingRef.current) {
        options?.onListenStop?.();
      }
    } else {
      // Si la transcripción principal está activa, la pausamos antes de escuchar comandos.
      if (wasRecordingRef.current) {
        options?.onListenStart?.();
      }
      start();
    }
  }, [isListening, start, stop, options]);

  return { isListening, toggleListening };
};
