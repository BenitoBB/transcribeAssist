// src/lib/transcription/server-proxy.ts
/**
 * Proxy para conectar con un backend de transcripción via WebSocket.
 * Implementación:
 *  - Abrir WebSocket a /api/transcribe/ws o a tu servidor externo.
 *  - Enviar audio en chunks (PCM/opus) y recibir mensajes JSON con transcripcion incremental.
 *
 * Ejemplo simple de API:
 *  - Cliente envía: { type: 'chunk', data: <base64-pcm> }
 *  - Servidor responde: { type: 'partial', text: '...' } o { type: 'final', text: '...' }
 */

let ws: WebSocket | null = null;

export async function startServerTranscription(
  model: string,
  onTranscriptionUpdate: (t: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      ws = new WebSocket('ws://localhost:8000/ws/transcribe'); // ajustar URL
      ws.onopen = () => {
        // enviar metadata/selección de modelo
        ws!.send(JSON.stringify({ type: 'config', model }));
        resolve();
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'partial' || msg.type === 'final') {
            onTranscriptionUpdate(msg.text);
          }
        } catch (e) {
          console.error('mensaje ws no JSON', e);
        }
      };
      ws.onclose = () => {
        ws = null;
      };
      ws.onerror = (e) => {
        console.error('WebSocket error', e);
      };
    } catch (err) {
      reject(err);
    }
  });
}

export function stopServerTranscription(): void {
  if (ws) {
    try {
      ws.send(JSON.stringify({ type: 'stop' }));
      ws.close();
    } catch {}
    ws = null;
  }
}