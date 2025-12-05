// src/lib/transcription/whisper-wasm.ts
/**
 * Inicio/Parada para whisper-wasm (cliente).
 * Implementación sugerida:
 * - Usar whisper.cpp / ggml wasm bindings (proyectos: whisper.cpp wasm, whisper-wasm)
 * - Cargar modelo en un Web Worker (descarga pesada).
 * - Pasar chunks de audio preprocesado (PCM) al worker y recibir transcripciones.
 *
 * Aquí dejamos stubs que lanzan errores si no se implementa.
 */

export const startWhisperWasm = async (
  onTranscriptionUpdate: (text: string) => void
): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('Whisper WASM solo funciona en el navegador');
  }

  try {
    // Verificar disponibilidad de worker o módulo
    // ...existing code...
  } catch (error) {
    throw new Error(
      `Error al iniciar Whisper WASM: ${error instanceof Error ? error.message : 'Desconocido'}`
    );
  }
};

export const stopWhisperWasm = (): void => {
  // detener worker/recursos si se implementa
};