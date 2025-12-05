
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { config } from 'dotenv';

// Cargar las variables de entorno al inicio
config();

export const ai = genkit({
  plugins: [googleAI()],
});
