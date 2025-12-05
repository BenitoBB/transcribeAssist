import { NextRequest, NextResponse } from 'next/server';

let activeSession: any = null;

export async function POST(request: NextRequest) {
  try {
    if (!activeSession) {
      return NextResponse.json(
        { error: 'No hay sesión activa' },
        { status: 400 }
      );
    }

    const model = activeSession.model;
    console.log(`⏹️ Deteniendo transcripción del modelo: ${model}`);

    // Procesar según el modelo
    let result = {};
    switch (model) {
      case 'whisper-server':
        result = await processWhisperServer(activeSession);
        break;
      case 'whisper-translate':
        result = await processWhisperTranslate(activeSession);
        break;
      case 'vosk-server':
        result = await processVoskServer(activeSession);
        break;
      case 'silero-server':
        result = await processSileroServer(activeSession);
        break;
    }

    activeSession = null;

    return NextResponse.json(
      {
        success: true,
        message: `${model} detenido correctamente`,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error al detener transcripción:', error);
    activeSession = null;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

async function processWhisperServer(session: any) {
  // Integración con API de Whisper (openai-python, local-whisper, etc)
  console.log('📝 Procesando con Whisper Server...');

  // TODO: Implementar llamada real a Whisper
  // const response = await fetch('http://localhost:8000/transcribe', {
  //   method: 'POST',
  //   body: audioBlob,
  // });

  return {
    model: 'whisper-server',
    transcription: 'Transcripción simulada de Whisper Server',
  };
}

async function processWhisperTranslate(session: any) {
  console.log('🌍 Procesando con Whisper + Traducción...');

  // TODO: Implementar llamada con traducción
  return {
    model: 'whisper-translate',
    transcription: 'Transcripción simulada',
    translation: 'Simulated transcription',
  };
}

async function processVoskServer(session: any) {
  console.log('🎤 Procesando con Vosk Server...');

  // TODO: Integración con Vosk WebSocket
  return {
    model: 'vosk-server',
    transcription: 'Transcripción simulada de Vosk',
  };
}

async function processSileroServer(session: any) {
  console.log('⚡ Procesando con Silero Server...');

  // TODO: Integración con Silero STT
  return {
    model: 'silero-server',
    transcription: 'Transcripción simulada de Silero',
  };
}
