export type TranscriptionModel =
  | 'web-speech-api'
  | 'whisper-wasm'
  | 'whisper-server'
  | 'whisper-translate'
  | 'vosk-server'
  | 'silero-server';

export type ModelLocation = 'local' | 'cloud';
export type ModelWeight = 'light' | 'medium' | 'heavy';

export interface ModelConfig {
  id: TranscriptionModel;
  name: string;
  location: ModelLocation;
  weight: ModelWeight;
  description: string;
  estimatedLoadTime: string; // ej: "instant", "~5s", "~30s"
}

export const MODELS_CONFIG: Record<TranscriptionModel, ModelConfig> = {
  'web-speech-api': {
    id: 'web-speech-api',
    name: 'Web Speech API',
    location: 'local',
    weight: 'light',
    description: 'Reconocimiento de voz del navegador',
    estimatedLoadTime: 'instant',
  },
  'whisper-wasm': {
    id: 'whisper-wasm',
    name: 'Whisper WASM',
    location: 'local',
    weight: 'heavy',
    description: 'Whisper ejecutándose localmente (descarga ~140MB)',
    estimatedLoadTime: '~30s primera vez',
  },
  'whisper-server': {
    id: 'whisper-server',
    name: 'Whisper Server',
    location: 'cloud',
    weight: 'light',
    description: 'Whisper en servidor remoto',
    estimatedLoadTime: '~2-5s',
  },
  'whisper-translate': {
    id: 'whisper-translate',
    name: 'Whisper + Traducción',
    location: 'cloud',
    weight: 'medium',
    description: 'Transcripción + traducción automática',
    estimatedLoadTime: '~5-10s',
  },
  'vosk-server': {
    id: 'vosk-server',
    name: 'Vosk Server',
    location: 'cloud',
    weight: 'light',
    description: 'Reconocimiento de voz rápido',
    estimatedLoadTime: '~1-3s',
  },
  'silero-server': {
    id: 'silero-server',
    name: 'Silero Server',
    location: 'cloud',
    weight: 'medium',
    description: 'STT en tiempo real de baja latencia',
    estimatedLoadTime: '~2-4s',
  },
};

export const getModelLabel = (modelId: TranscriptionModel): string => {
  const config = MODELS_CONFIG[modelId];
  const weightIcon = {
    light: '⚡',
    medium: '⚙️',
    heavy: '🔥',
  }[config.weight];

  const locationIcon = config.location === 'local' ? '📱' : '☁️';

  return `${config.name} ${weightIcon} ${locationIcon}`;
};

export const getAvailableModels = (): TranscriptionModel[] => {
  return Object.keys(MODELS_CONFIG) as TranscriptionModel[];
};
