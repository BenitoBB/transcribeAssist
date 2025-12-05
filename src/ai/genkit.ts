import './dev'; // Asegúrate de que las variables de entorno se carguen primero
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
});
