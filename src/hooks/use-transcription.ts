'use client';

import { useContext } from 'react';
import {
  TranscriptionContext,
  TranscriptionContextType,
} from '@/context/TranscriptionContext';

/**
 * Hook personalizado para acceder al contexto de transcripción.
 * Proporciona una forma sencilla para que los componentes interactúen
 * con el estado y las funciones de la transcripción.
 *
 * @returns El contexto de la transcripción.
 */
export const useTranscription = (): TranscriptionContextType => {
  const context = useContext(TranscriptionContext);
  if (!context) {
    throw new Error(
      'useTranscription debe ser utilizado dentro de un TranscriptionProvider'
    );
  }
  return context;
};
