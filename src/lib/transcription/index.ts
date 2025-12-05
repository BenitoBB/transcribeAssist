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
let commandCallback: ((command: string) => void) | null = null;

// --- Sistema de Eventos para la UI ---
type TranscriptionCallback = (text: string, isFinal: boolean) => void;
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

function notifyTextListeners(text: string, isFinal: boolean) {
  textListeners.forEach(listener => listener(text, isFinal));
}

function notifyStateListeners(state: TranscriptionState) {
  stateListeners.forEach(listener => listener(state, state));
}

/**
 * Registra una única función de callback para procesar comandos de voz.
 * @param callback La función que se ejecutará cuando se detecte un posible comando.
 */
export function registerCommands(callback: (command: string) => void) {
  commandCallback = callback;
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
      notifyTextListeners(errorMsg, true);
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
      notifyTextListeners('🎙️ Grabación iniciada...', true);
      notifyStateListeners('recording');
      resolve();
    };

    recognition.onend = () => {
      notifyTextListeners(finalTranscription || 'Grabación detenida.', true);
      notifyStateListeners('stopped');
      recognition = null;
    };

    recognition.onerror = (event) => {
      if (['no-speech', 'aborted'].includes(event.error)) {
        return;
      }
      console.error('Error en el reconocimiento de voz:', event.error);
      const errorMsg = `Error: ${event.error}`;
      notifyTextListeners(errorMsg, true);
      reject(new Error(errorMsg));
    };

    recognition.onresult = (event) => {
      let interimTranscription = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          if (commandCallback) {
            commandCallback(transcript.trim());
          }
          finalTranscription += transcript.charAt(0).toUpperCase() + transcript.slice(1) + '. ';
        } else {
          interimTranscription += transcript;
        }
      }
      const fullText = finalTranscription + interimTranscription;
      notifyTextListeners(fullText, false); // Interim update
      
      // Send a final update when the final transcription changes
      if (event.results[event.results.length - 1].isFinal) {
        notifyTextListeners(finalTranscription, true);
      }
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
        notifyTextListeners(errorMsg, true);
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