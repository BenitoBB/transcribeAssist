
'use server';

/**
 * @fileOverview Flujo para obtener la definición de una palabra usando la Free Dictionary API.
 * - Consulta la API del diccionario para español.
 * - Devuelve la primera definición encontrada.
 */
import { z } from 'zod';

const DefineWordInputSchema = z.object({
  word: z.string().describe('La palabra a definir.'),
});
export type DefineWordInput = z.infer<typeof DefineWordInputSchema>;

const DefineWordOutputSchema = z.object({
  definition: z.string().describe('La definición de la palabra.'),
});
export type DefineWordOutput = z.infer<typeof DefineWordOutputSchema>;

// Exportamos la función que será llamada desde el cliente.
export async function defineWord(
  input: DefineWordInput
): Promise<DefineWordOutput> {
  const { word } = input;
  let definition: string;

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/es/${encodeURIComponent(word)}`
    );

    // Si la palabra no se encuentra, la API devuelve 404
    if (response.status === 404) {
      definition = `No se encontró una definición para "${word}".`;
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
      definition = `No se encontró una definición clara para "${word}".`;
    }

  } catch (error) {
    console.error('Error al contactar la API del diccionario:', error);
    definition = `No se pudo obtener la definición para "${word}".`;
  }

  return { definition };
}
