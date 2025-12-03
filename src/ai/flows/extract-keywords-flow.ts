'use server';
/**
 * @fileOverview Flujo de Genkit para extraer palabras clave y conceptos de un texto.
 *
 * - extractKeywords - Una Server Action que toma un texto y devuelve una lista de conceptos clave.
 * - Keyword - La estructura de un concepto clave, con su término, explicación y emoji.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const KeywordsInputSchema = z.string();

export const KeywordSchema = z.object({
  keyword: z.string().describe('La palabra o concepto clave principal.'),
  explanation: z.string().describe('Una breve explicación (1-2 frases) del concepto basada en el texto proporcionado.'),
  emoji: z.string().describe('Un emoji de un solo carácter que represente visualmente el concepto.'),
});

export type Keyword = z.infer<typeof KeywordSchema>;

const KeywordsOutputSchema = z.array(KeywordSchema);

const keywordsPrompt = ai.definePrompt({
  name: 'keywordsPrompt',
  model: googleAI('gemini-1.5-flash-latest'),
  input: { schema: KeywordsInputSchema },
  output: { schema: KeywordsOutputSchema },
  prompt: `Analiza el siguiente texto de una transcripción de una clase. Tu tarea es identificar y extraer los 5-7 conceptos, términos o ideas más importantes.

Para cada concepto clave, proporciona:
1.  "keyword": El término o frase corta (2-3 palabras máx).
2.  "explanation": Una explicación concisa (1-2 frases) basada **únicamente** en la información presente en el texto. No inventes nada.
3.  "emoji": Un único emoji que represente el concepto.

Devuelve el resultado como un array de objetos JSON. No incluyas conceptos genéricos o que no aporten valor.

Texto a analizar:
"{{prompt}}"
`,
});

const extractKeywordsFlow = ai.defineFlow(
  {
    name: 'extractKeywordsFlow',
    inputSchema: KeywordsInputSchema,
    outputSchema: KeywordsOutputSchema,
  },
  async (text) => {
    if (!text || text.length < 50) {
      return []; // No ejecutar si el texto es muy corto
    }
    const { output } = await keywordsPrompt(text);
    return output ?? [];
  }
);

/**
 * Server Action para extraer palabras clave de un texto.
 * @param text El texto a analizar.
 * @returns Un array de objetos Keyword.
 */
export async function extractKeywords(text: string): Promise<Keyword[]> {
  return extractKeywordsFlow(text);
}
