export type AIProgressData = {
  status: string;
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

class AIService {
  private worker: Worker | null = null;
  private callbacks: Map<string, Function> = new Map();
  public onProgress?: (data: AIProgressData) => void;
  public onReady?: () => void;
  public onError?: (err: string) => void;
  public isReady: boolean = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window !== 'undefined' && !this.worker) {
      // Instanciar el worker directamente desde /public para burlar a Turbopack
      this.worker = new Worker('/ai-worker.js', {
        type: 'module'
      });

      this.worker.addEventListener('message', (event) => {
        const { type, id, result, data, error } = event.data;
        
        if (type === 'PROGRESS' && this.onProgress) {
          this.onProgress(data);
        } else if (type === 'READY') {
          this.isReady = true;
          if (this.onReady) this.onReady();
        } else if (type === 'RESULT' && id && this.callbacks.has(id)) {
          this.callbacks.get(id)!(result);
          this.callbacks.delete(id);
        } else if (type === 'ERROR') {
          console.error('[AI Service Error]:', error);
          if (this.onError) this.onError(error);
        }
      });
    }
  }

  public loadModel() {
    this.initWorker();
    this.worker?.postMessage({ type: 'LOAD' });
  }

  public summarizeText(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }
      const id = Math.random().toString(36).substring(7);
      this.callbacks.set(id, resolve);
      this.worker.postMessage({ type: 'SUMMARIZE', id, text });
      
      // Timeout elevado porque los resúmenes toman su tiempo (60 seg)
      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error('AI Request Timeout'));
        }
      }, 60000);
    });
  }
}

export const aiProvider = new AIService();
