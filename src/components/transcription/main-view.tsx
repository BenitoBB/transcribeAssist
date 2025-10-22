'use client';

import { useWhisperTranscription } from '@/hooks/use-whisper-transcription';
import TranscriptionControls from './transcription-controls';
import TranscriptionEditor from './transcription-editor';
import StatusPanel from './status-panel';

export default function MainView() {
  const {
    transcript,
    isTranscribing,
    loadingModel,
    modelReady,
    loadModel,
    startTranscription,
    stopTranscription,
  } = useWhisperTranscription();

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <TranscriptionEditor transcript={transcript} />
      </div>
      <aside>
        <div className="relative flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
          <StatusPanel 
            isTranscribing={isTranscribing} 
            loadingModel={loadingModel} 
            modelReady={modelReady} 
          />
          <TranscriptionControls
            isTranscribing={isTranscribing}
            modelReady={modelReady}
            onStart={startTranscription}
            onStop={stopTranscription}
            onLoadModel={loadModel}
          />
        </div>
      </aside>
    </div>
  );
}
