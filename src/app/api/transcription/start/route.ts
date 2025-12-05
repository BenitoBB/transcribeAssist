import { NextRequest, NextResponse } from 'next/server';
import type { TranscriptionModel } from '@/lib/models-config';

let activeSession: {
  model: TranscriptionModel;
  mediaRecorder?: MediaRecorder;
  audioChunks: Blob[];
} | null = null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { model: TranscriptionModel };
    const { model } = body;

    // Validar modelo
    const serverModels: TranscriptionModel[] = [
      'whisper-server',
      'whisper-translate',
      'vosk-server',
      'silero-server',
    ];

    if (!serverModels.includes(model)) {
      return NextResponse.json(
        { error: `Modelo no válido: ${model}` },
        { status: 400 }
      );
    }

    // Inicializar sesión
    activeSession = {
      model,
      audioChunks: [],
    };

    console.log(`✅ Transcripción iniciada con modelo: ${model}`);

    return NextResponse.json(
      { 
        success: true,
        message: `${model} iniciado correctamente`,
        model,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error al iniciar transcripción:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
