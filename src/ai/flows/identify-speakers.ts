'use server';
/**
 * @fileOverview Identifies the speakers in a transcription.
 *
 * - identifySpeakers - A function that handles the speaker identification process.
 * - IdentifySpeakersInput - The input type for the identifySpeakers function.
 * - IdentifySpeakersOutput - The return type for the identifySpeakers function.
 */

import {getAiClient} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifySpeakersInputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcription of the lecture.'),
   apiKey: z.string().optional().describe('The user provided API key for Google AI.'),
});
export type IdentifySpeakersInput = z.infer<typeof IdentifySpeakersInputSchema>;

const IdentifySpeakersOutputSchema = z.object({
  identifiedTranscription: z.string().describe('The transcription with speaker identification.'),
});
export type IdentifySpeakersOutput = z.infer<typeof IdentifySpeakersOutputSchema>;

export async function identifySpeakers(input: IdentifySpeakersInput): Promise<IdentifySpeakersOutput> {
  return identifySpeakersFlow(input);
}

const identifySpeakersFlow = async (input: IdentifySpeakersInput) => {
    const ai = getAiClient({apiKey: input.apiKey});
    const prompt = ai.definePrompt({
        name: 'identifySpeakersPrompt',
        input: {schema: IdentifySpeakersInputSchema},
        output: {schema: IdentifySpeakersOutputSchema},
        prompt: `You are an expert in identifying speakers in a lecture transcription.
    
      Given the following transcription, identify the speakers and add speaker labels to the beginning of each line.
      For example:
      Professor: This is the start of the lecture.
      Student 1: I have a question about the previous topic.
      Student 2: Can you explain that again?
      Professor: Sure, I can explain it again.
    
      Transcription: {{{transcription}}}
      `,
    });

    const {output} = await prompt(input);
    return output!;
}
