
'use server';

/**
 * @fileOverview Flujo para obtener la definición de una palabra usando la Free Dictionary API.
 * - Usa 'lemmatizer' para encontrar la raíz de la palabra.
 * - Consulta la API del diccionario para español con la palabra raíz.
 * - Devuelve la primera definición encontrada.
 */
import { z } from 'zod';
import lemmatizer from 'lemmatizer';

const DefineWordInputSchema = z.object({
  word: z.string().describe('La palabra a definir.'),
});
export type DefineWordInput = z.infer<typeof DefineWordInputSchema>;

const DefineWordOutputSchema = z.object({
  definition: z.string().describe('La definición de la palabra.'),
});
export type DefineWordOutput = z.infer<typeof DefineWordOutputSchema>;

export async function defineWord(
  input: DefineWordInput
): Promise<DefineWordOutput> {
  // Limpia y encuentra la raíz de la palabra.
  const originalWord = input.word.toLowerCase();
  const rootWord = lemmatizer.lemmatizer(originalWord);
  
  let definition: string;

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/es/${encodeURIComponent(rootWord)}`
    );

    // Si la palabra no se encuentra, la API devuelve 404
    if (response.status === 404) {
      definition = `No se encontró una definición para "${originalWord}".`;
      return { definition };
    }

    if (!response.ok) {
      throw new Error(`La API del diccionario respondió con el estado: ${response.status}`);
    }

    const data = await response.json();
    
    // Extraer la primera definición de la estructura de la respuesta
    const firstMeaning = data[0]?.meanings[0];
    const firstDefinition = firstMeaning?.definitions[0]?.definition;

    if (firstDefinition) {
      definition = firstDefinition;
    } else {
      definition = `No se encontró una definición clara para "${originalWord}".`;
    }

  } catch (error) {
    console.error('Error al contactar la API del diccionario:', error);
    definition = `No se pudo obtener la definición para "${originalWord}".`;
  }

  return { definition };
}
