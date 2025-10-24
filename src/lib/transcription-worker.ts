/// <reference lib="webworker" />

import { pipeline, env } from '@xenova/transformers';

// Al estar en un worker, podemos configurar el entorno de forma segura.
// NOTA: No es necesario configurar `allowLocalModels` a `false`. 
// La configuración por defecto ya prioriza los modelos remotos, que es lo que queremos.
// Añadir `env.allowLocalModels = false;` puede causar problemas en algunos entornos de navegador.

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

// Función para decodificar y remuestrear el audio a 16kHz
async function decodeAndResample(audioData: ArrayBuffer): Promise<Float32Array> {
    // La clave es crear el AudioContext con la sampleRate que Whisper espera.
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const decodedAudio = await audioContext.decodeAudioData(audioData);
    return decodedAudio.getChannelData(0);
}


self.onmessage = async (event) => {
    const { type, audio } = event.data;
    
    if (type === 'load') {
        // Carga el modelo la primera vez que se solicita.
        await TranscriptionPipeline.getInstance();
        return;
    }
    
    if (type === 'transcribe') {
        const transcriber = await TranscriptionPipeline.getInstance();
        if (!transcriber) return;

        try {
            // 1. Decodificar el buffer de audio (probablemente webm/ogg) a PCM Float32Array a 16kHz.
            const pcmData = await decodeAndResample(audio.buffer);
            
            // 2. Realizar la transcripción.
            const output = await transcriber(pcmData, {
                chunk_length_s: 30,
                language: 'spanish',
                task: 'transcribe',
            });

            if (output) {
                // 3. Enviar el resultado de vuelta al hilo principal.
                postMessage({ status: 'result', output });
            }
        } catch (error: any) {
            postMessage({ status: 'error', data: error.message });
        }
    }
};
