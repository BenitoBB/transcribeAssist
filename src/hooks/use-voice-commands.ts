'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

// Referencia global al reconocimiento para evitar múltiples instancias
let recognition: SpeechRecognition | null = null;

/**
 * Hook para manejar el reconocimiento de comandos de voz.
 * @param onCommand - Callback que se ejecuta cuando se reconoce un comando válido.
 */
export const useVoiceCommands = (onCommand: (command: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  // Usamos una ref para la callback para evitar que el useEffect dependa de ella
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const manualStop = useRef(false);

  const stopListening = useCallback(() => {
    manualStop.current = true;
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (isListening) return; // <-- AÑADIDO: Prevenir inicio si ya está escuchando

    manualStop.current = false;
    // Comprobar la compatibilidad del navegador
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Error de VUI',
        description: 'Tu navegador no soporta los comandos de voz. Prueba con Google Chrome.',
      });
      return;
    }
    
    // Evita crear una nueva instancia si ya existe
    if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onend = () => {
          setIsListening(false);
          // Si no fue un stop manual, intenta reiniciar la escucha.
          if (!manualStop.current) {
            try {
                recognition?.start();
            } catch(e) {
              // Ignorar error si ya se detuvo o cambió de pestaña
            }
          }
        };

        recognition.onerror = (event) => {
          if (['no-speech', 'audio-capture', 'aborted'].includes(event.error)) {
            return;
          }
          console.error('Error en el reconocimiento de voz para comandos:', event.error);
        };

        recognition.onresult = (event) => {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
            const command = lastResult[0].transcript.trim().toLowerCase();
            onCommandRef.current(command);
          }
        };
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        // Solo iniciar si no está ya escuchando
        if (!isListening) {
          recognition?.start();
        }
      })
      .catch(err => {
        console.error('No se pudo acceder al micrófono para los comandos de voz:', err);
        toast({
          variant: 'destructive',
          title: 'Error de micrófono',
          description: 'No se pudo acceder al micrófono para los comandos de voz.',
        });
        stopListening();
      });

  }, [toast, stopListening, isListening]); // <-- AÑADIDO: isListening como dependencia
  
  const toggleListening = useCallback(() => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
  }, [isListening, startListening, stopListening]);
  
  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
        if(recognition) {
            manualStop.current = true;
            recognition.onstart = null;
            recognition.onend = null;
            recognition.onerror = null;
            recognition.onresult = null;
            recognition.stop();
            recognition = null;
        }
    };
  }, []);

  return { isListening, toggleListening };
};
