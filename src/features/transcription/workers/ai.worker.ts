// Polifill anti-Turbopack: Usamos notación de corchetes para evadir que el empaquetador 
// reemplace estáticamente los tokens (AST Replacement)
const globalObj = typeof self !== 'undefined' ? self : globalThis;
if (!(globalObj as any)['process']) {
  (globalObj as any)['process'] = {};
}
if (!(globalObj as any)['process']['env']) {
  (globalObj as any)['process']['env'] = {};
}
if (!(globalObj as any)['process']['versions']) {
  (globalThis as any)['process']['versions'] = { node: '18.0.0' };
}

import { pipeline, env } from '@xenova/transformers';

// Configuración recomendada para navegadores
env.allowLocalModels = false;
env.useBrowserCache = true;

class TextSummarizer {
  static task = 'summarization';
  static model = 'Xenova/t5-small';
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      // @ts-ignore
      this.instance = await pipeline(this.task, this.model, { 
        progress_callback,
        quantized: true, 
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, id, text } = event.data;

  try {
    if (type === 'LOAD') {
      await TextSummarizer.getInstance((x: any) => {
        // Ignorar eventos 'done' sin progreso para no ensuciar la UI
        if (x.status === 'progress' || x.status === 'init' || x.status === 'download') {
          self.postMessage({ type: 'PROGRESS', data: x });
        }
      });
      self.postMessage({ type: 'READY' });
      return;
    }

    if (type === 'SUMMARIZE') {
      const summarizer = await TextSummarizer.getInstance();
      
      // t5-small requiere un prefijo para la tarea de resumen
      const prompt = `summarize: ${text}`;
      
      const result = await summarizer(prompt, {
        max_new_tokens: 150,
        // Eliminamos min_length: 30 para evitar crasheos si el texto a resumir es extremadamente corto
        temperature: 0.5,
        no_repeat_ngram_size: 2,
      });

      self.postMessage({
        type: 'RESULT',
        id,
        result: result[0].summary_text
      });
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message || String(error) });
  }
});

