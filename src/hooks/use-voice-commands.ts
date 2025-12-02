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

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, []);

  const startListening = useCallback(() => {
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
    
    // Si ya existe una instancia, la detenemos antes de crear una nueva
    if (recognition) {
        recognition.stop();
        recognition = null;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false; // No necesitamos resultados parciales para comandos
    recognition.continuous = false; // Escucha un solo comando y se detiene

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Si el reconocimiento se detuvo y debería seguir escuchando (no fue un stop manual),
      // lo reiniciamos para que siga atento a comandos.
      if (recognition) {
          try {
              recognition.start();
          } catch(e) {
            // A veces, si se cambia de pestaña, puede dar error. Lo ignoramos.
          }
      }
    };

    recognition.onerror = (event) => {
      // Errores como 'no-speech', 'audio-capture', o 'aborted' son normales. Los ignoramos.
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

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        recognition?.start();
      })
      .catch(err => {
        console.error('No se pudo acceder al micrófono para los comandos de voz:', err);
        toast({
          variant: 'destructive',
          title: 'Error de micrófono',
          description: 'No se pudo acceder al micrófono para los comandos de voz.',
        });
        // Si hay error, nos aseguramos de que no siga intentando.
        stopListening();
      });

  }, [toast, stopListening]);
  
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
            recognition.stop();
            recognition = null;
        }
    };
  }, []);

  return { isListening, toggleListening };
};
