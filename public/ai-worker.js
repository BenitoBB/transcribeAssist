import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.allowLocalModels = false;
env.useBrowserCache = true;

class TextSummarizer {
  static task = 'text2text-generation';
  // Cambiamos a modelo instruccional Flan-T5, rinde mejor en textos que no son estrictamente inglés
  static model = 'Xenova/LaMini-Flan-T5-78M';
  static instance = null;

  static async getInstance(progress_callback) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { 
        progress_callback,
        quantized: true, 
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { type, id, text } = event.data;

  try {
    if (type === 'LOAD') {
      await TextSummarizer.getInstance((x) => {
        if (x.status === 'download' || x.status === 'progress' || x.status === 'init' || x.status === 'done') {
          self.postMessage({ type: 'PROGRESS', data: x });
        }
      });
      self.postMessage({ type: 'READY' });
      return;
    }

    if (type === 'SUMMARIZE') {
      // Avisar que empieza la generación
      self.postMessage({ type: 'PROGRESS', data: { status: 'generating' } });
      
      const summarizer = await TextSummarizer.getInstance();
      
      // Prompt instruccional en inglés (los modelos on-device responden mejor a comandos en inglés)
      const prompt = `Summarize the following text in Spanish directly and concisely: ${text}`;
      
      const result = await summarizer(prompt, {
        max_new_tokens: 150,
        temperature: 0.3, // Temperatura baja para evitar "alucinaciones"
        repetition_penalty: 1.2,
      });

      self.postMessage({
        type: 'RESULT',
        id,
        result: result[0].generated_text
      });
      // Avisar que terminó la generación
      self.postMessage({ type: 'PROGRESS', data: { status: 'idle' } });
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message || String(error) });
  }
});
