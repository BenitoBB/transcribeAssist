'use server';
/**
 * @fileOverview Flujo de Genkit para resumir texto.
 *
 * - summarizeText - Una función que toma un texto y devuelve un resumen.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeTextInputSchema = z.object({
  text: z.string().describe('El texto de la transcripción a resumir.'),
});

export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('El resumen generado del texto.'),
});

export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(
  input: SummarizeTextInput
): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Eres un asistente experto en educación. A continuación se te proporciona la transcripción de una clase. Tu tarea es generar un resumen claro y conciso de la misma. El resumen debe estar bien estructurado, usando negritas para los conceptos clave y listas para enumerar puntos importantes.

      Transcripción:
      ---
      ${input.text}
      ---
      
      Por favor, genera el resumen.`,
    });

    return { summary: text };
  }
);
