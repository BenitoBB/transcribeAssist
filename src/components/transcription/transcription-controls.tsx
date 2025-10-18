"use client";

import { Mic, MicOff, BrainCircuit, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

type TranscriptionControlsProps = {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  onIdentifySpeakers: () => void;
  onSummarize: () => void;
  isProcessingAI: boolean;
  hasActiveSession: boolean;
  hasRecognitionSupport: boolean;
  apiKeySet: boolean;
};

export function TranscriptionControls({
  isListening,
  onStart,
  onStop,
  onIdentifySpeakers,
  onSummarize,
  isProcessingAI,
  hasActiveSession,
  hasRecognitionSupport,
  apiKeySet
}: TranscriptionControlsProps) {
  const aiButtonsDisabled = isProcessingAI || isListening || !hasActiveSession || !apiKeySet;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        {!isListening ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onStart} disabled={!hasRecognitionSupport || isProcessingAI} size="lg" className="bg-[#4CAF50] hover:bg-[#45a049] text-white">
                <Mic className="mr-2 h-5 w-5" />
                Start Transcription
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hasRecognitionSupport ? 'Begin real-time transcription' : 'Speech recognition not supported'}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onStop} variant="destructive" size="lg">
                <MicOff className="mr-2 h-5 w-5" />
                Stop & Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>End the current session and save</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        <div className="flex-grow" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onIdentifySpeakers} variant="outline" disabled={aiButtonsDisabled}>
              <BrainCircuit className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{apiKeySet ? 'Identify Speakers (AI)' : 'API Key required'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onSummarize} variant="outline" disabled={aiButtonsDisabled}>
              <FileText className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{apiKeySet ? 'Summarize Lecture (AI)' : 'API Key required'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
