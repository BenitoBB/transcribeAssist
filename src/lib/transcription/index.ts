/**
 * ===================================================================================
 * Lógica de Transcripción del Lado del Cliente con @xenova/transformers.js
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para ejecutar un modelo de Whisper directamente en el navegador.
 */

import { pipeline, RawImage } from '@xenova/transformers';

let transcriber: any = null;
let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let processorNode: AudioWorkletNode | null = null;
let isRecording = false;
let isModelLoading = false;

// Un simple sistema de eventos para notificar a los componentes de React sobre las actualizaciones.
type TranscriptionCallback = (text: string) => void;
const listeners: TranscriptionCallback[] = [];
let fullTranscription = '';

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
 * Carga el modelo de transcripción si aún no se ha cargado.
 */
async function loadTranscriber() {
  if (isModelLoading) {
     notifyListeners('El modelo ya se está cargando...');
     return;
  }

  if (!transcriber) {
    isModelLoading = true;
    notifyListeners('Cargando modelo de IA... Esto puede tardar un momento.');
    try {
      // Usamos un modelo de Whisper destilado, optimizado para ejecutarse en el navegador.
      // 'tiny' o 'base' son buenas opciones para empezar.
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
      notifyListeners('Modelo de IA cargado. ¡Listo para transcribir!');
    } catch (error) {
      console.error('Error al cargar el modelo:', error);
      notifyListeners('Error: No se pudo cargar el modelo de IA.');
      transcriber = null; // Asegurarse de que no intentemos usar un modelo fallido
    } finally {
      isModelLoading = false;
    }
  }
}

/**
 * Inicia la captura y el reconocimiento de audio.
 */
export async function startTranscription(): Promise<void> {
  if (isRecording) {
    console.warn('La grabación ya está en curso.');
    return;
  }

  await loadTranscriber();

  if (!transcriber) {
    console.error('El transcriptor no está cargado. No se puede iniciar la grabación.');
    return;
  }

  try {
    audioContext = new AudioContext({ sampleRate: 16000 });
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    await audioContext.audioWorklet.addModule(new URL('./worklet-processor.js', import.meta.url));
    
    const source = audioContext.createMediaStreamSource(mediaStream);
    processorNode = new AudioWorkletNode(audioContext, 'vfs-processor');
    
    processorNode.port.onmessage = async (event) => {
      const audioData = event.data;
      if (audioData) {
         notifyListeners(fullTranscription + '...');
        const result = await transcriber(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
        });
        if (result && result.text) {
           fullTranscription += result.text + ' ';
           notifyListeners(fullTranscription);
        }
      }
    };
    
    source.connect(processorNode);
    processorNode.connect(audioContext.destination);

    isRecording = true;
    fullTranscription = '';
    notifyListeners('🎙️ Grabación iniciada...');

  } catch (err) {
    console.error('Error al iniciar la transcripción:', err);
    notifyListeners(`Error al iniciar: ${err instanceof Error ? err.message : String(err)}`);
    stopTranscription();
  }
}

/**
 * Detiene el proceso de transcripción.
 */
export function stopTranscription(): void {
  if (!isRecording && !isModelLoading) {
    // Si no está grabando y no está cargando, no hay nada que hacer
    // (excepto si el modelo nunca se cargó)
    if (!transcriber) {
        notifyListeners('La transcripción no está activa.');
    } else {
        notifyListeners(fullTranscription || 'Grabación detenida.');
    }
    return;
  }

  isRecording = false;

  // Cierra los recursos de audio
  if (processorNode) {
    processorNode.disconnect();
    processorNode = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  // Notificar al usuario que la grabación ha finalizado
  if (fullTranscription) {
      notifyListeners(fullTranscription);
  } else {
      notifyListeners('Grabación detenida. No se transcribió nada.');
  }
}

// Este script se ejecutará en un AudioWorklet, un hilo separado para procesar audio.
// No es un archivo físico, sino que se convierte en una URL de objeto.
const workletCode = `
class VFSProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferPos = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputData = input[0];
      // Acumular los datos de audio
      for (let i = 0; i < inputData.length; i++) {
        this.buffer[this.bufferPos++] = inputData[i];
        if (this.bufferPos === this.bufferSize) {
          // Enviar el buffer completo cuando esté lleno
          this.port.postMessage(this.buffer);
          this.bufferPos = 0; // Reiniciar
        }
      }
    }
    return true; // Mantener el procesador activo
  }
}
registerProcessor('vfs-processor', VFSProcessor);
`;

// Crear una URL para el worklet a partir del código string.
// Esto evita la necesidad de tener un archivo JS separado en la carpeta 'public'.
if (typeof window !== 'undefined') {
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletURL = URL.createObjectURL(blob);
    // Sobrescribimos la URL para que el addModule la encuentre
    Object.defineProperty(URL, 'createObjectURL', {
        value: () => workletURL,
        writable: false
    });

    // Pequeño truco para que `new URL(...)` funcione en el contexto de la creación del worklet
    const originalURL = window.URL;
    (window as any).URL = class CustomURL extends originalURL {
        constructor(url: string, base: string) {
            if (url.endsWith('worklet-processor.js')) {
                super(workletURL);
                return;
            }
            super(url, base);
        }
    };
}
