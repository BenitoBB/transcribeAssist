/**
 * ===================================================================================
 * Lógica de Transcripción del Lado del Cliente con Web Speech API
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para usar la API de reconocimiento de voz nativa del navegador.
 */

const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

let recognition: any = null;

/**
 * Inicia la captura y el reconocimiento de audio.
 */
export async function startWebSpeechApi(
    onTranscriptionUpdate: (text: string) => void
): Promise<void> {
  if (!SpeechRecognition) {
    throw new Error('Web Speech API no soportado en este navegador');
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'es-ES';

  recognition.onstart = () => {
    console.log('Grabación iniciada');
  };

  let finalTranscript = '';
  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
        onTranscriptionUpdate(finalTranscript);
      } else {
        interimTranscript += transcript;
        onTranscriptionUpdate(finalTranscript + interimTranscript);
      }
    }
  };

  recognition.onerror = (event: any) => {
    console.error('Error en Web Speech API:', event.error);
    throw new Error(`Error de reconocimiento: ${event.error}`);
  };

  recognition.start();
}


/**
 * Detiene el proceso de transcripción.
 */
export function stopWebSpeechApi(): void {
  if (recognition) {
    recognition.stop();
  }
}
