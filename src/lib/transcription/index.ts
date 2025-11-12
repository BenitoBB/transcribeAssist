/**
 * ===================================================================================
 * Lógica de Transcripción del Lado del Cliente con Web Speech API
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para usar la API de reconocimiento de voz nativa del navegador.
 */

let recognition: SpeechRecognition | null = null;
let isRecording = false;
let finalTranscription = '';

// Un simple sistema de eventos para notificar a los componentes de React sobre las actualizaciones.
type TranscriptionCallback = (text: string) => void;
const listeners: TranscriptionCallback[] = [];

/**
 * Permite a los componentes de React suscribirse a las actualizaciones de la transcripción.
 * @param callback La función a llamar cuando haya una nueva transcripción.
 * @returns Una función para cancelar la suscripción.
 */
export function onTranscriptionUpdate(callback: TranscriptionCallback) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Notifica a todos los oyentes suscritos sobre el nuevo texto de transcripción.
 * @param text El texto actualizado de la transcripción.
 */
function notifyListeners(text: string) {
  listeners.forEach(listener => listener(text));
}

/**
 * Inicia la captura y el reconocimiento de audio.
 */
export async function startTranscription(): Promise<void> {
  if (isRecording) {
    console.warn('La grabación ya está en curso.');
    return;
  }

  // Comprobar la compatibilidad del navegador
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    const errorMsg = 'Tu navegador no soporta la API de Reconocimiento de Voz. Prueba con Google Chrome.';
    notifyListeners(errorMsg);
    console.error(errorMsg);
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.interimResults = true; // Queremos resultados mientras hablamos
  recognition.continuous = true; // Queremos que siga escuchando

  recognition.onstart = () => {
    isRecording = true;
    finalTranscription = ''; // Reiniciar al comenzar
    notifyListeners('🎙️ Grabación iniciada...');
  };

  recognition.onend = () => {
    isRecording = false;
    notifyListeners(finalTranscription || 'Grabación detenida.');
    recognition = null;
  };

  recognition.onerror = (event) => {
    console.error('Error en el reconocimiento de voz:', event.error);
    notifyListeners(`Error: ${event.error}`);
  };

  recognition.onresult = (event) => {
    let interimTranscription = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscription += event.results[i][0].transcript + ' ';
      } else {
        interimTranscription += event.results[i][0].transcript;
      }
    }
    notifyListeners(finalTranscription + interimTranscription);
  };

  try {
    // Pedir permiso de micrófono (esto ya no es estrictamente necesario para la API,
    // pero es buena práctica y el navegador lo pedirá de todos modos)
    await navigator.mediaDevices.getUserMedia({ audio: true });
    recognition.start();
  } catch (err) {
     const errorMsg = 'No se pudo acceder al micrófono. Por favor, comprueba los permisos en tu navegador.';
     notifyListeners(errorMsg);
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
  if (!recognition || !isRecording) {
    console.warn('No hay ninguna grabación activa para detener.');
    return;
  }
  recognition.stop();
}