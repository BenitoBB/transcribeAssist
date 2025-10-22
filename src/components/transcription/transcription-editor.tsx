import { Textarea } from '@/components/ui/textarea';

type TranscriptionEditorProps = {
  transcript: string;
};

export default function TranscriptionEditor({ transcript }: TranscriptionEditorProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-2">Live Transcription</h2>
      <Textarea
        value={transcript}
        readOnly
        className="flex-grow text-lg leading-relaxed p-4 border-2 rounded-md min-h-[500px] bg-white"
        placeholder="The transcribed text will appear here..."
      />
    </div>
  );
}
