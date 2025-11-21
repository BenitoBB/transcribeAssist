
'use server';

/**
 * @fileOverview Flujo para obtener la definición de una palabra desde Wikipedia.
 * - Consulta la API de Wikipedia.
 * - Devuelve el extracto del artículo directamente.
 */
import { z } from 'zod';

const DefineWordInputSchema = z.object({
  word: z.string().describe('La palabra a definir.'),
});
export type DefineWordInput = z.infer<typeof DefineWordInputSchema>;

const DefineWordOutputSchema = z.object({
  definition: z.string().describe('La definición de la palabra obtenida de Wikipedia.'),
});
export type DefineWordOutput = z.infer<typeof DefineWordOutputSchema>;

// Exportamos la función que será llamada desde el cliente.
export async function defineWord(
  input: DefineWordInput
): Promise<DefineWordOutput> {
  const { word } = input;
  let wikipediaContent: string;

  try {
    const response = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`,
      {
        headers: {
          'User-Agent': 'TranscribeAssist/1.0 (https://example.com)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`La API de Wikipedia respondió con el estado: ${response.status}`);
    }

    const data = await response.json();
    
    // Si la respuesta es una página de desambiguación o no hay contenido, lo consideramos no encontrado.
    if (data.type === 'disambiguation' || !data.extract) {
       wikipediaContent = `No se encontró una entrada directa para "${word}" en Wikipedia.`;
    } else {
       wikipediaContent = data.extract;
    }

  } catch (error) {
    console.error('Error al contactar la API de Wikipedia:', error);
    wikipediaContent = `No se pudo obtener información para "${word}" desde Wikipedia.`;
  }

  return { definition: wikipediaContent };
}
