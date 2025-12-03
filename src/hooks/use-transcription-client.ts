'use client';

import { useEffect } from 'react';
import { onStateChange, onTranscriptionUpdate } from '@/lib/transcription';
import { useTranscription } from './use-transcription';

/**
 * Este hook se encarga de conectar la lógica de transcripción (que solo
 * se ejecuta en el cliente) con el contexto de React. Se debe usar
 * en cualquier página que necesite mostrar o controlar la transcripción.
 * 
 * NO SE DEBE USAR MÁS. LA LÓGICA SE HA MOVIDO A LOS COMPONENTES
 * DINÁMICOS CORRESPONDIENTES PARA EVITAR ERRORES DE HIDRATACIÓN.
 * 
 * @deprecated
 */
export const useTranscriptionClient = () => {
  const { setTranscription, setIsRecording } = useTranscription();

  useEffect(() => {
    // Sincronizar el estado de la grabación (isRecording)
    const handleStateChange = (newState: 'recording' | 'stopped' | 'idle') => {
      setIsRecording(newState === 'recording');
    };

    // Sincronizar el texto de la transcripción
    const handleTranscriptionUpdate = (newText: string) => {
      setTranscription(newText);
    };

    const unsubscribeState = onStateChange(handleStateChange);
    const unsubscribeText = onTranscriptionUpdate(handleTranscriptionUpdate);

    // Limpiar las suscripciones al desmontar el componente
    return () => {
      unsubscribeState();
      unsubscribeText();
    };
  }, [setTranscription, setIsRecording]); // Las dependencias aseguran que esto solo se ejecute una vez
};
