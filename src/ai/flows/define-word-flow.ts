
'use server';

/**
 * @fileOverview Flujo para obtener la definición de una palabra.
 * - Primero consulta la API de Wikipedia.
 * - Luego usa un modelo de IA para resumir la definición de forma concisa.
 */
import { ai } from '../genkit';
import { z } from 'zod';

const DefineWordInputSchema = z.object({
  word: z.string().describe('La palabra a definir.'),
});
export type DefineWordInput = z.infer<typeof DefineWordInputSchema>;

const DefineWordOutputSchema = z.object({
  definition: z.string().describe('La definición concisa de la palabra.'),
});
export type DefineWordOutput = z.infer<typeof DefineWordOutputSchema>;

// Exportamos la función que será llamada desde el cliente.
export async function defineWord(
  input: DefineWordInput
): Promise<DefineWordOutput> {
  return defineWordFlow(input);
}

// 1. Definimos un prompt para la IA
const definitionPrompt = ai.definePrompt({
    name: 'definitionPrompt',
    input: { schema: z.object({ word: z.string(), context: z.string() }) },
    output: { schema: DefineWordOutputSchema },
    prompt: `Eres un asistente de diccionario. Dada la siguiente información de Wikipedia, extrae y resume una definición clara y concisa para la palabra "{{word}}". La definición debe ser fácil de entender para un estudiante. Si la información no parece una definición, responde que no encontraste una definición clara.

Información de contexto:
{{{context}}}
`,
  });

// 2. Definimos el flujo principal
const defineWordFlow = ai.defineFlow(
  {
    name: 'defineWordFlow',
    inputSchema: DefineWordInputSchema,
    outputSchema: DefineWordOutputSchema,
  },
  async ({ word }) => {
    // Primero, llamamos a la API de Wikipedia para obtener el resumen.
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
      wikipediaContent = data.extract || 'No se encontró un resumen en Wikipedia.';
      
      // Si la respuesta es sobre "otras usos" o no hay contenido, lo consideramos no encontrado.
      if (data.title === 'Especial:Buscar' || !data.extract) {
         wikipediaContent = `No se encontró una entrada directa para "${word}" en Wikipedia.`;
      }


    } catch (error) {
      console.error('Error al contactar la API de Wikipedia:', error);
      wikipediaContent = `No se pudo obtener información para "${word}" desde Wikipedia.`;
    }

    // Si no hay contenido de Wikipedia, devolvemos un mensaje directo.
    if (wikipediaContent.startsWith('No se pudo') || wikipediaContent.startsWith('No se encontró')) {
        return { definition: wikipediaContent };
    }

    // Luego, pasamos el contenido a la IA para que lo resuma.
    const { output } = await definitionPrompt({
        word,
        context: wikipediaContent,
    });
    
    return output!;
  }
);
