'use server';
/**
 * @fileOverview Flujo de Genkit para resumir un texto.
 *
 * - summarizeText: La Server Action que se llama desde el cliente.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// No se necesita un schema de salida complejo, solo un string.
const SummarizeTextOutputSchema = z.string().describe('El resumen conciso del texto proporcionado.');

// Definir el prompt para la tarea de resumen
const summarizePrompt = ai.definePrompt({
  name: 'summarizePrompt',
  model: googleAI.model('gemini-pro'), // Especificar el modelo aquí
  input: { schema: z.string() }, // El input es el texto a resumir
  output: { schema: SummarizeTextOutputSchema },
  prompt: `Eres un asistente experto en educación. Tu tarea es leer la siguiente transcripción de una clase y generar un resumen conciso y claro en español. El resumen debe capturar los puntos más importantes y los conceptos clave de la lección.

Transcripción de la clase:
{{{input}}}

Por favor, proporciona un resumen claro y bien estructurado en formato de párrafos.`,
});

// Definir el flujo que utiliza el prompt
const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: z.string(),
    outputSchema: SummarizeTextOutputSchema,
  },
  async (text) => {
    const { output } = await summarizePrompt(text);
    return output || 'No se pudo generar el resumen.';
  }
);

/**
 * Server Action para generar un resumen de un texto.
 * @param text El texto de la transcripción a resumir.
 * @returns Un string con el resumen generado por la IA.
 */
export async function summarizeText(text: string): Promise<string> {
  return await summarizeTextFlow(text);
}
