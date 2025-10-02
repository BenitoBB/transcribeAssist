export type TranscriptionSession = {
  id: string;
  title: string;
  date: string;
  content: string;
  summary?: string;
  notes: Array<{
    id: string;
    text: string;
    highlightedContent: string;
  }>;
};
