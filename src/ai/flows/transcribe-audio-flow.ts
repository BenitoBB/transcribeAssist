'use server';
/**
 * @fileOverview Flujo de Genkit para transcribir audio usando un modelo de Google.
 *
 * - transcribeAudio - Una función que toma datos de audio y devuelve el texto transcrito.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Los datos de audio como un data URI, incluyendo el MIME type y la codificación Base64. Formato esperado: 'data:audio/webm;codecs=opus;base64,<encoded_data>'"
    ),
});

export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('El texto resultante de la transcripción.'),
});

export type TranscribeAudioOutput = z.infer<
  typeof TranscribeAudioOutputSchema
>;

export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        {
          text: `Transcribe el siguiente audio de una clase en español. Asegúrate de añadir puntuación y estructurar el texto de manera legible.`,
        },
        { media: { url: input.audioDataUri } },
      ],
    });

    return { transcription: text };
  }
);
