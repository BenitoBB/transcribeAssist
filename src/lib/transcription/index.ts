/**
 * ===================================================================================
 * Lógica de Transcripción del Lado del Cliente con Web Speech API
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para usar la API de reconocimiento de voz nativa del navegador.
 */

export type TranscriptionState = 'idle' | 'recording' | 'stopped';

let recognition: SpeechRecognition | null = null;
let isRecordingInternal = false;
let finalTranscription = '';

// Sistema de eventos para el TEXTO
type TranscriptionCallback = (text: string) => void;
const textListeners: TranscriptionCallback[] = [];

// Sistema de eventos para el ESTADO de la grabación
type StateChangeCallback = (state: TranscriptionState) => void;
const stateListeners: StateChangeCallback[] = [];

/**
 * Suscripción a las actualizaciones de la transcripción de texto.
 */
export function onTranscriptionUpdate(callback: TranscriptionCallback) {
  textListeners.push(callback);
  return () => {
    const index = textListeners.indexOf(callback);
    if (index > -1) textListeners.splice(index, 1);
  };
}

/**
 * Suscripción a los cambios de estado (idle, recording, stopped).
 */
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
 * Inicia la captura y el reconocimiento de audio.
 */
export async function startTranscription(): Promise<void> {
  if (isRecordingInternal) {
    console.warn('La grabación ya está en curso.');
    return;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    const errorMsg = 'Tu navegador no soporta la API de Reconocimiento de Voz. Prueba con Google Chrome.';
    notifyTextListeners(errorMsg);
    console.error(errorMsg);
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    isRecordingInternal = true;
    finalTranscription = '';
    notifyTextListeners('🎙️ Grabación iniciada...');
    notifyStateListeners('recording');
  };

  recognition.onend = () => {
    isRecordingInternal = false;
    notifyTextListeners(finalTranscription || 'Grabación detenida.');
    notifyStateListeners('stopped');
    recognition = null;
  };

  recognition.onerror = (event) => {
    if (['no-speech', 'aborted'].includes(event.error)) {
      return;
    }
    console.error('Error en el reconocimiento de voz:', event.error);
    notifyTextListeners(`Error: ${event.error}`);
  };

  recognition.onresult = (event) => {
    let interimTranscription = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        const transcript = event.results[i][0].transcript.trim();
        if (transcript) {
          finalTranscription += transcript + '\n';
        }
      } else {
        interimTranscription += event.results[i][0].transcript;
      }
    }
    notifyTextListeners(finalTranscription + interimTranscription);
  };

  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    recognition.start();
  } catch (err) {
     const errorMsg = 'No se pudo acceder al micrófono. Por favor, comprueba los permisos en tu navegador.';
     notifyTextListeners(errorMsg);
     console.error(errorMsg, err);
     if (recognition) {
         recognition.stop();
     }
  }
}


/**
 * Detiene el proceso de transcripción.
 */
export function stopTranscription(): void {
  if (!recognition || !isRecordingInternal) {
    console.warn('No hay ninguna grabación activa para detener.');
    return;
  }
  recognition.stop();
}
