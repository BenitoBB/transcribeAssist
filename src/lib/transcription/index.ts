/**
 * ===================================================================================
 * Lógica de Transcripción del Lado del Cliente con Web Speech API
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para usar la API de reconocimiento de voz nativa del navegador.
 */

export type TranscriptionState = 'idle' | 'recording' | 'stopped';

let recognition: SpeechRecognition | null = null;
let finalTranscription = '';
let registeredCommands: { [key: string]: () => void } = {};

// --- Sistema de Eventos para la UI ---
type TranscriptionCallback = (text: string) => void;
const textListeners: TranscriptionCallback[] = [];

type StateChangeCallback = (state: TranscriptionState) => void;
const stateListeners: StateChangeCallback[] = [];

export function onTranscriptionUpdate(callback: TranscriptionCallback) {
  textListeners.push(callback);
  return () => {
    const index = textListeners.indexOf(callback);
    if (index > -1) textListeners.splice(index, 1);
  };
}

export function onStateChange(callback: StateChangeCallback) {
  stateListeners.push(callback);
  return () => {
    const index = stateListeners.indexOf(callback);
    if (index > -1) stateListeners.splice(index, 1);
  };
}

function notifyTextListeners(text: string) {
  textListeners.forEach(listener => listener(text));
}

function notifyStateListeners(state: TranscriptionState) {
  stateListeners.forEach(listener => listener(state));
}

/**
 * Registra los comandos de voz que el sistema debe reconocer.
 * @param commands - Un objeto donde la clave es el comando (sin espacios, en minúsculas) y el valor es la función a ejecutar.
 */
export function registerCommands(commands: { [key: string]: () => void }) {
  registeredCommands = commands;
}

/**
 * Procesa una frase finalizada, comprobando si es un comando o texto normal.
 * @param transcript - La frase a procesar.
 */
function processFinalTranscript(transcript: string) {
  const cleanedTranscript = transcript.toLowerCase().replace(/\s+/g, '').replace(/[.,¡!¿?]/g, '');

  if (registeredCommands[cleanedTranscript]) {
    registeredCommands[cleanedTranscript]();
  } else {
    // Añade la transcripción con la primera letra en mayúscula y un salto de línea.
    const formattedTranscript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
    finalTranscription += formattedTranscript + '\n';
  }
}

/**
 * Inicia la captura y el reconocimiento de audio.
 */
export function startTranscription(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (recognition) {
      console.warn('La grabación ya está en curso.');
      resolve();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const errorMsg = 'Tu navegador no soporta la API de Reconocimiento de Voz. Prueba con Google Chrome.';
      notifyTextListeners(errorMsg);
      console.error(errorMsg);
      reject(new Error(errorMsg));
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      finalTranscription = '';
      notifyTextListeners('🎙️ Grabación iniciada...');
      notifyStateListeners('recording');
      resolve();
    };

    recognition.onend = () => {
      notifyTextListeners(finalTranscription || 'Grabación detenida.');
      notifyStateListeners('stopped');
      recognition = null;
    };

    recognition.onerror = (event) => {
      if (['no-speech', 'aborted'].includes(event.error)) {
        return;
      }
      console.error('Error en el reconocimiento de voz:', event.error);
      const errorMsg = `Error: ${event.error}`;
      notifyTextListeners(errorMsg);
      reject(new Error(errorMsg));
    };

    recognition.onresult = (event) => {
      let interimTranscription = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          processFinalTranscript(transcript);
        } else {
          interimTranscription += event.results[i][0].transcript;
        }
      }
      notifyTextListeners(finalTranscription + interimTranscription);
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        try {
          recognition?.start();
        } catch (e) {
          // A veces puede lanzar error si ya empezó, lo ignoramos.
        }
      })
      .catch((err) => {
        const errorMsg = 'No se pudo acceder al micrófono. Por favor, comprueba los permisos en tu navegador.';
        notifyTextListeners(errorMsg);
        console.error(errorMsg, err);
        if (recognition) {
            recognition.stop();
        }
        reject(err);
      });
  });
}


/**
 * Detiene el proceso de transcripción.
 */
export function stopTranscription(): void {
  if (!recognition) {
    return;
  }
  recognition.stop();
}
