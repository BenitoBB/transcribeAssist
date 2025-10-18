import {genkit, GenerationOptions, ModelReference} from 'genkit';
import {googleAI, GoogleAIGenerativeAI} from '@genkit-ai/google-genai';

type AiClientParams = {
  apiKey?: string | undefined;
  options?: GenerationOptions | undefined;
  model?: ModelReference<GoogleAIGenerativeAI>;
};

export const getAiClient = ({
  apiKey,
  options,
  model,
}: AiClientParams) => {
  return genkit({
    plugins: [googleAI({apiKey})],
    model: model ?? 'googleai/gemini-2.5-flash-image-preview',
    ...options,
  });
};
