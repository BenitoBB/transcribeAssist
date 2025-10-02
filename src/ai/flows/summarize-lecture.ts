'use server';

/**
 * @fileOverview Summarizes a lecture transcription.
 *
 * - summarizeLecture - A function that summarizes a lecture transcription.
 * - SummarizeLectureInput - The input type for the summarizeLecture function.
 * - SummarizeLectureOutput - The return type for the summarizeLecture function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLectureInputSchema = z.object({
  transcription: z
    .string()
    .describe('The full transcription of the lecture to summarize.'),
});
export type SummarizeLectureInput = z.infer<typeof SummarizeLectureInputSchema>;

const SummarizeLectureOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the lecture.'),
});
export type SummarizeLectureOutput = z.infer<typeof SummarizeLectureOutputSchema>;

export async function summarizeLecture(input: SummarizeLectureInput): Promise<SummarizeLectureOutput> {
  return summarizeLectureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLecturePrompt',
  input: {schema: SummarizeLectureInputSchema},
  output: {schema: SummarizeLectureOutputSchema},
  prompt: `You are an expert summarizer of lectures.

  Please provide a concise summary of the lecture transcript below, focusing on the key points and main topics covered.
  Transcription: {{{transcription}}}`,
});

const summarizeLectureFlow = ai.defineFlow(
  {
    name: 'summarizeLectureFlow',
    inputSchema: SummarizeLectureInputSchema,
    outputSchema: SummarizeLectureOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
