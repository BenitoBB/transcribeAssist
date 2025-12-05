import { NextRequest, NextResponse } from 'next/server';
import type { TranscriptionModel } from '@/lib/models-config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const model = formData.get('model') as TranscriptionModel;

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'No audio proporcionado' },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Modelo no especificado' },
        { status: 400 }
      );
    }

    console.log(`🎵 Procesando audio con ${model}`);

    // Convertir blob a buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let transcription = '';

    // Procesar según modelo
    switch (model) {
      case 'whisper-server':
        transcription = await callWhisperAPI(buffer);
        break;
      case 'whisper-translate':
        transcription = await callWhisperAPI(buffer, 'translate');
        break;
      case 'vosk-server':
        transcription = await callVoskAPI(buffer);
        break;
      case 'silero-server':
        transcription = await callSileroAPI(buffer);
        break;
      default:
        throw new Error(`Modelo no soportado: ${model}`);
    }

    return NextResponse.json(
      { 
        success: true,
        transcription,
        model,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error procesando audio:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

async function callWhisperAPI(buffer: Buffer, task?: string): Promise<string> {
  // TODO: Implementar llamada real
  // Ejemplo con API local:
  // const response = await fetch('http://localhost:8000/transcribe', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/octet-stream' },
  //   body: buffer,
  // });
  
  console.log(`📝 Llamando Whisper${task === 'translate' ? ' (Translate)' : ''}...`);
  return 'Transcripción de Whisper';
}

async function callVoskAPI(buffer: Buffer): Promise<string> {
  // TODO: Implementar conexión WebSocket con Vosk
  // Vosk requiere WebSocket para streaming de audio
  console.log('🎤 Llamando Vosk...');
  return 'Transcripción de Vosk';
}

async function callSileroAPI(buffer: Buffer): Promise<string> {
  // TODO: Implementar llamada a Silero
  console.log('⚡ Llamando Silero...');
  return 'Transcripción de Silero';
}
