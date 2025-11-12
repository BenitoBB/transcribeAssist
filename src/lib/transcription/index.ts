/**
 * ===================================================================================
 * Lógica de Transcripción del Lado del Cliente con Web Speech API
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para interactuar con la API de reconocimiento de voz del navegador.
 */

// Tipado para el objeto de reconocimiento de voz, que puede no estar en todos los navegadores.
interface CustomWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

declare let window: CustomWindow;

let recognition: any | null = null;
let finalTranscription = '';
let isStopping = false;

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
  // Comprueba si la API es compatible con el navegador
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    throw new Error('La API de reconocimiento de voz no es soportada en este navegador.');
  }

  // Detiene cualquier reconocimiento anterior
  if (recognition) {
    recognition.stop();
  }

  // Pide permiso para el micrófono (necesario solo si no se ha concedido antes)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Detenemos la pista inmediatamente porque la API de SpeechRecognition la gestiona por su cuenta
    stream.getTracks().forEach(track => track.stop());
  } catch (err) {
     console.error("Error al obtener permiso del micrófono:", err);
     throw new Error("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
  }


  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES'; // Configurar el idioma
  recognition.interimResults = true; // Queremos resultados provisionales mientras hablamos
  recognition.continuous = true; // Queremos que siga escuchando

  finalTranscription = '';
  isStopping = false;
  notifyListeners('🎙️ Escuchando...');

  recognition.onresult = (event: any) => {
    let interimTranscription = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscription += event.results[i][0].transcript + '. ';
      } else {
        interimTranscription += event.results[i][0].transcript;
      }
    }
    notifyListeners(finalTranscription + interimTranscription);
  };

  recognition.onerror = (event: any) => {
    console.error('Error en el reconocimiento de voz:', event.error);
    let errorMessage = 'Error en el reconocimiento: ';
    if (event.error === 'no-speech') {
      errorMessage += 'No se detectó voz.';
    } else if (event.error === 'audio-capture') {
      errorMessage += 'Problema con el micrófono.';
    } else if (event.error === 'not-allowed') {
      errorMessage += 'Permiso denegado. Habilita el acceso al micrófono.';
    } else {
      errorMessage += event.error;
    }
    notifyListeners(errorMessage);
  };

  recognition.onend = () => {
    // Si no estamos parando manualmente, reiniciamos el reconocimiento
    // para que sea verdaderamente continuo.
    if (!isStopping) {
      recognition.start();
    } else {
        notifyListeners(finalTranscription || "Grabación detenida.");
    }
  };

  recognition.start();
}

/**
 * Detiene el proceso de transcripción.
 */
export function stopTranscription(): void {
  if (recognition) {
    isStopping = true;
    recognition.stop();
    notifyListeners('Procesando transcripción final...');
  }
}
