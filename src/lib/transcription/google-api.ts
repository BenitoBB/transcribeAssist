/**
 * ===================================================================================
 * Lógica de Transcripción con API de Google (Lado del Cliente)
 * ===================================================================================
 * Este archivo se encarga de capturar el audio del micrófono, enviarlo a nuestro
 * flujo de Genkit en el servidor para su transcripción, y manejar la respuesta.
 */

import { transcribeAudio } from '@/ai/flows/transcribe-audio-flow';

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let onUpdate: (text: string, isFinal: boolean) => void;

/**
 * Inicia la grabación del micrófono.
 * @param onTranscriptionUpdate - Callback para notificar de nuevo texto.
 */
export async function startGoogleApi(
  onTranscriptionUpdate: (text: string, isFinal: boolean) => void
): Promise<void> {
  onUpdate = onTranscriptionUpdate;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

    mediaRecorder.onstart = () => {
      audioChunks = [];
    };

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    // Cuando se detiene la grabación, procesamos el audio.
    mediaRecorder.onstop = async () => {
      onUpdate('Procesando audio...', false);
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      const reader = new FileReader();

      reader.onload = async () => {
        const base64Audio = reader.result as string;
        try {
          const result = await transcribeAudio({ audioDataUri: base64Audio });
          onUpdate(result.transcription, true);
        } catch (error) {
          console.error('Error al transcribir con Google:', error);
          onUpdate('Error en la transcripción del servidor.', true);
        }
      };
      
      reader.onerror = () => {
          console.error('Error al leer el blob de audio');
          onUpdate('Error al procesar el audio localmente.', true);
      }

      reader.readAsDataURL(audioBlob);
    };

    mediaRecorder.start();
  } catch (err) {
    console.error('Error al acceder al micrófono:', err);
    throw new Error('No se pudo acceder al micrófono. Por favor, comprueba los permisos en tu navegador.');
  }
}

/**
 * Detiene la grabación. El evento 'onstop' se encargará del resto.
 */
export function stopGoogleApi(): void {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    
    // Apagar las pistas del micrófono para que el icono de grabación del navegador desaparezca
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}
