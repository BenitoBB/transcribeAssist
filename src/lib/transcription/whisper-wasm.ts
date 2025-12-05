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

export async function startWhisperWasm(onTranscriptionUpdate: (t: string) => void): Promise<void> {
  throw new Error('whisper-wasm no está implementado. Revisa src/lib/transcription/whisper-wasm.ts para instrucciones.');
}

export function stopWhisperWasm(): void {
  // detener worker/recursos si se implementa
}