'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

// Define el tipo para la instancia de reconocimiento de voz para mayor seguridad.
type SpeechRecognitionInstance = SpeechRecognition;

/**
 * Hook para manejar el reconocimiento de comandos de voz.
 * @param onCommand - Callback que se ejecuta cuando se reconoce un comando válido.
 */
export const useVoiceCommands = (onCommand: (command: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  
  // Usamos una ref para la instancia de reconocimiento para que persista entre renders.
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Ref para la callback para tener siempre la última versión sin causar re-renders.
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  // Ref para saber si el usuario ha detenido la escucha manualmente.
  const manualStopRef = useRef(false);

  const toggleListening = useCallback(() => {
    // Si ya se está escuchando, se detiene.
    if (isListening) {
      manualStopRef.current = true; // Marca como detención manual
      recognitionRef.current?.stop();
      return;
    }

    // Si no se está escuchando, se inicia.
    manualStopRef.current = false; // Reinicia la marca
    
    // Comprobar la compatibilidad del navegador.
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast({
        variant: 'destructive',
        title: 'Error de VUI',
        description: 'Tu navegador no soporta los comandos de voz. Prueba con Google Chrome.',
      });
      return;
    }
    
    // Crea la instancia si no existe.
    if (!recognitionRef.current) {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.continuous = false; // Escucha una frase y se detiene.

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
            // Si no fue una detención manual, vuelve a escuchar.
            if (!manualStopRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    // Evita errores si se detiene rápido.
                }
            }
        };

        recognition.onerror = (event) => {
            if (!['no-speech', 'audio-capture', 'aborted'].includes(event.error)) {
                console.error('Error en el reconocimiento de voz para comandos:', event.error);
            }
        };

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.trim().toLowerCase();
            onCommandRef.current(command);
        };
        
        recognitionRef.current = recognition;
    }

    // Pide permiso de micrófono e inicia la escucha.
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // Ya podría estar iniciado si el usuario hace clics rápidos, lo ignoramos.
        }
      })
      .catch(err => {
        console.error('No se pudo acceder al micrófono para los comandos de voz:', err);
        toast({
          variant: 'destructive',
          title: 'Error de micrófono',
          description: 'No se pudo acceder al micrófono para los comandos de voz.',
        });
      });

  }, [isListening, toast]);
  
  // Limpieza al desmontar el componente.
  useEffect(() => {
    const recognition = recognitionRef.current;
    return () => {
      if (recognition) {
        manualStopRef.current = true;
        recognition.onstart = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, toggleListening };
};
