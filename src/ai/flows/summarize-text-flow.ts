'use server';
/**
 * @fileOverview Flujo de Genkit para resumir un texto.
 *
 * - summarizeText - Una Server Action que toma un texto y devuelve un resumen.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeInputSchema = z.string();
const SummarizeOutputSchema = z.string();

// Define el prompt de Genkit
const summarizePrompt = ai.definePrompt({
  name: 'summarizePrompt',
  input: { schema: SummarizeInputSchema },
  output: { schema: SummarizeOutputSchema },
  prompt: `Resume el siguiente texto de una clase de la manera más clara y concisa posible. 
  Extrae los puntos clave, conceptos importantes y cualquier tarea o conclusión mencionada.
  
  Texto a resumir:
  "{{prompt}}"
  
  Resumen:`,
});

// Define el flujo de Genkit
const summarizeFlow = ai.defineFlow(
  {
    name: 'summarizeFlow',
    inputSchema: SummarizeInputSchema,
    outputSchema: SummarizeOutputSchema,
  },
  async (text) => {
    const { output } = await summarizePrompt(text);
    return output ?? 'No se pudo generar un resumen.';
  }
);

/**
 * Server Action para resumir un texto.
 * Llama a un flujo de Genkit para realizar el resumen.
 * @param text El texto a resumir.
 * @returns El texto resumido como un string.
 */
export async function summarizeText(text: string): Promise<string> {
  return summarizeFlow(text);
}
