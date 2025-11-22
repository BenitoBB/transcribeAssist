'use server';

/**
 * @fileOverview Flujo simulado para resumir texto sin costo de API.
 */

import { z } from 'zod';

const SummarizeTextInputSchema = z.object({
  text: z.string().describe('El texto de la transcripción a resumir.'),
});

export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('El resumen generado del texto.'),
});

export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

/**
 * Simula la generación de un resumen.
 * No utiliza ninguna API externa de pago.
 * @param input El texto a resumir.
 * @returns Una promesa que resuelve a un resumen de ejemplo.
 */
export async function summarizeText(
  input: SummarizeTextInput
): Promise<SummarizeTextOutput> {
  // Simula un retraso de red o procesamiento para que la UI muestre el estado de carga
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Lógica de resumen simulada y de costo cero
  const summaryText = `
    <h3>Resumen de la Clase (Ejemplo)</h3>
    <p>Esta es una demostración de cómo se vería un resumen. Actualmente, la funcionalidad de resumen con IA no está conectada para evitar costos de API.</p>
    <h4>Puntos Clave:</h4>
    <ul>
      <li>Se ha solicitado una funcionalidad de resumen.</li>
      <li>Se ha priorizado el uso de tecnologías de <b>costo cero</b>.</li>
      <li>Este panel demuestra la interfaz de usuario para la futura integración de un modelo de resumen.</li>
    </ul>
    <p>El texto original tenía ${input.text.length} caracteres.</p>
  `;

  return { summary: summaryText };
}
