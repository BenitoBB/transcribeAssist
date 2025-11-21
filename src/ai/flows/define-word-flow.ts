'use server';
/**
 * @fileOverview Flujo para obtener la definición de una palabra.
 *
 * Este flujo utiliza una API de diccionario gratuita para buscar definiciones.
 * Implementa una lógica de doble intento:
 * 1. Intenta buscar la palabra exacta.
 * 2. Si falla, intenta buscar una forma raíz simplificada de la palabra.
 */

import { z } from 'zod';

const DefineWordInputSchema = z.object({
  word: z.string().describe('La palabra a definir.'),
});

export type DefineWordInput = z.infer<typeof DefineWordInputSchema>;

export type DefineWordOutput = {
  definition: string | null;
  error?: string;
};

/**
 * Busca la definición de una palabra utilizando una API de diccionario gratuita.
 * @param input Objeto que contiene la palabra a definir.
 * @returns Un objeto con la definición o un mensaje de error.
 */
export async function defineWord(
  input: DefineWordInput
): Promise<DefineWordOutput> {
  const word = input.word.toLowerCase();

  // Función interna para buscar en la API
  const fetchDefinition = async (wordToFetch: string) => {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/es/${wordToFetch}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { definition: null, error: 'not-found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Extraer la primera definición encontrada
      if (Array.isArray(data) && data.length > 0) {
        const firstMeaning = data[0].meanings?.[0];
        const firstDefinition = firstMeaning?.definitions?.[0]?.definition;
        if (firstDefinition) {
          return { definition: firstDefinition, error: null };
        }
      }
      return { definition: null, error: 'no-definition-found' };

    } catch (error) {
      console.error('Error fetching definition:', error);
      return { definition: null, error: 'api-error' };
    }
  };

  // 1. Primer intento: con la palabra original
  let result = await fetchDefinition(word);

  if (result.definition) {
    return { definition: result.definition };
  }
  
  // 2. Segundo intento: con una raíz simplificada (si el primer intento falló)
  let rootWord = '';
  if (word.length > 4) {
     if (word.endsWith('s')) {
        rootWord = word.slice(0, -1);
     } else if (word.endsWith('es')) {
        rootWord = word.slice(0, -2);
     }
  }

  if (rootWord && rootWord !== word) {
    result = await fetchDefinition(rootWord);
    if (result.definition) {
      return { definition: result.definition };
    }
  }
  
  // Si ambos intentos fallan
  return {
    definition: null,
    error: `No se encontró una definición para "${input.word}".`,
  };
}
