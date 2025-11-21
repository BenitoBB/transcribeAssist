
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

async function fetchDefinition(word: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/es/${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const firstMeaning = data[0]?.meanings[0];
    const firstDefinition = firstMeaning?.definitions[0]?.definition;

    return firstDefinition || null;
  } catch (error) {
    console.error(`Error al buscar la definición de "${word}":`, error);
    return null;
  }
}

export async function defineWord(
  input: DefineWordInput
): Promise<DefineWordOutput> {
  const originalWord = input.word.toLowerCase();
  
  // 1. Intentar buscar la palabra original
  let definition = await fetchDefinition(originalWord);

  // 2. Si no se encuentra, intentar con la raíz de la palabra
  if (!definition) {
    const rootWord = lemmatizer(originalWord);
    // Solo intentar con la raíz si es diferente a la palabra original
    if (rootWord !== originalWord) {
      definition = await fetchDefinition(rootWord);
    }
  }

  // 3. Si después de ambos intentos no hay definición, informar al usuario.
  if (!definition) {
    return { definition: `No se encontró una definición para "${originalWord}".` };
  }

  return { definition };
}
