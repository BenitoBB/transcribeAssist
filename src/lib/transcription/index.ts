/**
 * ===================================================================================
 * Lógica de Transcripción del Lado del Cliente
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para interactuar con las APIs de audio del navegador.
 */

// Estas variables mantendrán el estado del grabador de audio a través del módulo.
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let fullTranscription = '';

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
  // Devuelve una función de limpieza para que el componente pueda darse de baja.
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
  fullTranscription = text;
  listeners.forEach(listener => listener(text));
}

/**
 * Inicia la captura de audio del micrófono del usuario.
 * Pide permiso y configura el MediaRecorder.
 */
export async function startTranscription(): Promise<void> {
  // Comprueba si el navegador soporta la API de MediaStream
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('La API de MediaStream no es soportada en este navegador.');
  }

  // Detiene cualquier grabación anterior
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }

  // Pide permiso para acceder al micrófono
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Inicializa el MediaRecorder
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];
  fullTranscription = '';
  notifyListeners('🎙️ Grabando...');

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
    // En una implementación real, enviarías estos chunks a tu backend/servicio de transcripción.
    // console.log('Chunk de audio disponible:', event.data);
    // Simulamos una transcripción que se actualiza
    notifyListeners(fullTranscription + ' ...');
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    // En una implementación real, aquí podrías hacer algo con el audio completo,
    // como ofrecerlo para descarga o enviarlo para un análisis final.
    console.log('Grabación detenida. Blob de audio completo:', audioBlob);
    
    // Limpia el stream y las pistas de audio para liberar el micrófono
    stream.getTracks().forEach(track => track.stop());

    // Simulación del texto final
    notifyListeners(fullTranscription.replace(/ \.\.\./g, '') + ' (Transcripción final simulada).');
  };

  // Empieza a grabar. El segundo argumento (timeslice) especifica
  // que queremos recibir datos cada 2 segundos.
  mediaRecorder.start(2000); 
}

/**
 * Detiene el proceso de transcripción.
 */
export function stopTranscription(): void {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    notifyListeners('Procesando grabación...');
  }
}
