/**
 * ===================================================================================
 * Lógica de Transcripción del Lado del Cliente con Web Speech API
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para usar la API de reconocimiento de voz nativa del navegador.
 */

let recognition: SpeechRecognition | null = null;
let finalTranscription = '';
let onUpdate: (text: string, isFinal: boolean) => void;

/**
 * Inicia la captura y el reconocimiento de audio.
 */
export async function startWebSpeechApi(
    onTranscriptionUpdate: (text: string, isFinal: boolean) => void
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
    onUpdate('🎙️ Grabación iniciada...', false);
  };

  recognition.onend = () => {
    onUpdate(finalTranscription || 'Grabación detenida.', true);
    recognition = null;
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') {
      return;
    }
    console.error('Error en el reconocimiento de voz:', event.error);
    onUpdate(`Error: ${event.error}`, true);
  };

  recognition.onresult = (event) => {
    let interimTranscription = '';
    let currentFinal = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        currentFinal += event.results[i][0].transcript.trim() + '\n';
      } else {
        interimTranscription += event.results[i][0].transcript;
      }
    }
    
    if (currentFinal) {
        finalTranscription += currentFinal;
        onUpdate(finalTranscription, true);
    } else if (interimTranscription) {
        onUpdate(finalTranscription + interimTranscription, false);
    }
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
