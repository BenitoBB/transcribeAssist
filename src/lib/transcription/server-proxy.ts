// src/lib/transcription/server-proxy.ts
/**
 * Proxy para conectar con un backend de transcripción via WebSocket.
 * Implementación:
 *  - Abrir WebSocket a /api/transcribe/ws o a tu servidor externo.
 *  - Enviar audio en chunks (PCM/opus) y recibir mensajes JSON con transcripcion incremental.
 *
 * Ejemplo simple de API:
 *  - Cliente envía: { type: 'chunk', data: <base64-pcm> }
 *  - Servidor responde: { type: 'partial', text: '...' } o { type: 'final', text: '...' }
 */

import type { TranscriptionModel } from '@/lib/models-config';

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let stream: MediaStream | null = null;

export const startServerTranscription = async (
  model: TranscriptionModel,
  onTranscriptionUpdate: (text: string) => void
): Promise<void> => {
  const validServerModels: TranscriptionModel[] = [
    'whisper-server',
    'whisper-translate',
    'vosk-server',
    'silero-server',
  ];

  if (!validServerModels.includes(model)) {
    throw new Error(`❌ Modelo de servidor no válido: ${model}`);
  }

  try {
    // Iniciar grabación de audio
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onerror = (event) => {
      throw new Error(`Error en MediaRecorder: ${event.error}`);
    };

    // Notificar al backend que iniciamos
    const initResponse = await fetch('/api/transcription/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    });

    if (!initResponse.ok) {
      throw new Error(`Error iniciando ${model}: ${initResponse.statusText}`);
    }

    const initData = await initResponse.json();
    console.log(`✅ ${initData.message}`);
    onTranscriptionUpdate(`Grabando con ${model}...`);

    mediaRecorder.start();
  } catch (error) {
    throw new Error(
      `❌ Error iniciando ${model}: ${error instanceof Error ? error.message : 'Desconocido'}`
    );
  }
};

export const stopServerTranscription = async (): Promise<void> => {
  if (!mediaRecorder || !stream) {
    throw new Error('❌ No hay grabación activa');
  }

  return new Promise((resolve, reject) => {
    mediaRecorder!.onstop = async () => {
      try {
        // Crear blob de audio
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        // Enviar al servidor para procesamiento
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('model', mediaRecorder!.mimeType);

        const processResponse = await fetch('/api/transcription/process', {
          method: 'POST',
          body: formData,
        });

        if (!processResponse.ok) {
          throw new Error(`Error procesando: ${processResponse.statusText}`);
        }

        // Notificar que detenemos
        await fetch('/api/transcription/stop', { method: 'POST' });

        // Detener stream
        stream!.getTracks().forEach((track) => track.stop());
        mediaRecorder = null;
        stream = null;
        audioChunks = [];

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    mediaRecorder!.stop();
  });
};