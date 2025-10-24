/// <reference lib="webworker" />

import { pipeline, env, RawImage } from '@xenova/transformers';

// Since we're in a worker, we can safely set the environment variables.
env.allowLocalModels = false;
env.allowBrowser = false;

class TranscriptionPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'openai/whisper-base';
    static instance: any = null;

    static async getInstance() {
        if (this.instance === null) {
            postMessage({ status: 'loading' });
            try {
                this.instance = await pipeline(this.task, this.model);
                postMessage({ status: 'ready' });
            } catch (error: any) {
                postMessage({ status: 'error', data: error.message });
            }
        }
        return this.instance;
    }
}

self.onmessage = async (event) => {
    const { type, audio } = event.data;
    
    if (type === 'load') {
        await TranscriptionPipeline.getInstance();
        return;
    }
    
    if (type === 'transcribe') {
        const transcriber = await TranscriptionPipeline.getInstance();
        if (!transcriber) return;

        try {
            // Convert the ArrayBuffer to a Float32Array
            const pcmData = new Float32Array(audio.buffer);
            
            // Transcribe
            const output = await transcriber(pcmData, {
                chunk_length_s: 30,
                language: 'spanish',
                task: 'transcribe',
            });

            if (output) {
                postMessage({ status: 'result', output });
            }
        } catch (error: any) {
            postMessage({ status: 'error', data: error.message });
        }
    }
};
