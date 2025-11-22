/**
 * ===================================================================================
 * Lógica de Transcripción del Lado del Cliente con Web Speech API
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para usar la API de reconocimiento de voz nativa del navegador.
 */

let recognition: SpeechRecognition | null = null;
let finalTranscription = '';
let onUpdate: (text: string) => void;

/**
 * Inicia la captura y el reconocimiento de audio.
 */
export async function startWebSpeechApi(
    onTranscriptionUpdate: (text: string) => void
): Promise<void> {
  onUpdate = onTranscriptionUpdate;

  // Comprobar la compatibilidad del navegador
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    throw new Error('Tu navegador no soporta la API de Reconocimiento de Voz. Prueba con Google Chrome.');
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.interimResults = true; // Queremos resultados mientras hablamos
  recognition.continuous = true; // Queremos que siga escuchando

  finalTranscription = ''; // Reiniciar al comenzar

  recognition.onstart = () => {
    onUpdate('🎙️ Grabación iniciada...');
  };

  recognition.onend = () => {
    onUpdate(finalTranscription || 'Grabación detenida.');
    recognition = null;
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') {
      return;
    }
    console.error('Error en el reconocimiento de voz:', event.error);
    onUpdate(`Error: ${event.error}`);
  };

  recognition.onresult = (event) => {
    let interimTranscription = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        // Concatenamos el resultado final con un salto de línea para legibilidad
        finalTranscription += event.results[i][0].transcript.trim() + '\n\n';
      } else {
        interimTranscription += event.results[i][0].transcript;
      }
    }
    
    // Actualizamos la UI con la transcripción final más la provisional actual
    onUpdate(finalTranscription + interimTranscription);
  };

  try {
    // Pedir permiso de micrófono
    await navigator.mediaDevices.getUserMedia({ audio: true });
    recognition.start();
  } catch (err) {
     console.error('No se pudo acceder al micrófono:', err);
     if (recognition) {
         recognition.stop();
     }
     throw new Error('No se pudo acceder al micrófono. Por favor, comprueba los permisos en tu navegador.');
  }
}


/**
 * Detiene el proceso de transcripción.
 */
export function stopWebSpeechApi(): void {
  if (recognition) {
    recognition.stop();
  }
}
