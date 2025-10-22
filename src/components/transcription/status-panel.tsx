import { Badge } from '@/components/ui/badge';

type StatusPanelProps = {
  isTranscribing: boolean;
  loadingModel: boolean;
  modelReady: boolean;
};

export default function StatusPanel({ isTranscribing, loadingModel, modelReady }: StatusPanelProps) {
  const getStatus = () => {
    if (loadingModel) {
      return { text: 'Loading Model...', color: 'bg-yellow-500' };
    }
    if (!modelReady) {
      return { text: 'Model Not Loaded', color: 'bg-gray-400' };
    }
    if (isTranscribing) {
      return { text: 'Recording...', color: 'bg-red-500 animate-pulse' };
    }
    return { text: 'Ready', color: 'bg-green-500' };
  };

  const { text, color } = getStatus();

  return (
    <div className="text-center p-2 rounded-lg bg-gray-100">
      <h3 className="font-semibold mb-2">Status</h3>
      <Badge className={`${color} text-white`}>{text}</Badge>
    </div>
  );
}
