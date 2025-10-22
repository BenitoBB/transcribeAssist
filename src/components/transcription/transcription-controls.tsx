import { Button } from '@/components/ui/button';
import { Mic, MicOff, Download, Square, Loader } from 'lucide-react';

type TranscriptionControlsProps = {
  isTranscribing: boolean;
  modelReady: boolean;
  onStart: () => void;
  onStop: () => void;
  onLoadModel: () => void;
};

export default function TranscriptionControls({
  isTranscribing,
  modelReady,
  onStart,
  onStop,
  onLoadModel,
}: TranscriptionControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      {!modelReady && (
        <Button onClick={onLoadModel} size="lg">
          <Loader className="mr-2" /> Load Transcription Model
        </Button>
      )}

      {modelReady && !isTranscribing && (
        <Button onClick={onStart} size="lg" className="bg-green-600 hover:bg-green-700">
          <Mic className="mr-2" /> Start Transcription
        </Button>
      )}

      {isTranscribing && (
        <Button onClick={onStop} variant="destructive" size="lg">
          <Square className="mr-2" /> Stop Transcription
        </Button>
      )}
      
      <Button variant="outline" size="lg" disabled={isTranscribing}>
        <Download className="mr-2" /> Download Transcript
      </Button>
    </div>
  );
}
