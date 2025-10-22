'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

// Define types dynamically to avoid direct import issues on server
type Pipeline = (...args: any[]) => any;
type AutomaticSpeechRecognitionPipeline = any;
type Env = {
  allowLocalModels: boolean;
  allowRemoteModels: boolean;
};

// Define the processor options
const CHUNK_LENGTH_SECONDS = 30;
const BATCH_SIZE = 6;

export function useWhisperTranscription() {
  // Model loading
  const [model, setModel] = useState<AutomaticSpeechRecognitionPipeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Transcription state
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Media recorder
  const recorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Dynamically import transformers
  const transformers = useRef<any>(null);

  useEffect(() => {
    async function loadTransformers() {
      if (typeof window !== 'undefined') {
        try {
          const trans = await import('@xenova/transformers');
          (trans.env as Env).allowLocalModels = false;
          (trans.env as Env).allowRemoteModels = true;
          transformers.current = trans;
        } catch (e) {
          console.error('Failed to load transformers.js', e);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load the transcription library.',
          });
        }
      }
    }
    loadTransformers();
  }, []);

  const loadModel = useCallback(async () => {
    if (loading || ready || !transformers.current) return;
    setLoading(true);
    try {
      const pipeline = transformers.current.pipeline;
      const pipe = await pipeline('automatic-speech-recognition', 'openai/whisper-base');
      setModel(() => pipe);
      setReady(true);
      toast({
        title: 'Model Ready',
        description: 'The transcription model is loaded and ready.',
      });
    } catch (e) {
      console.error('Failed to load model', e);
      toast({
        variant: 'destructive',
        title: 'Model Load Failed',
        description: 'Could not load the Whisper model.',
      });
    } finally {
      setLoading(false);
    }
  }, [loading, ready]);

  const startTranscription = useCallback(async () => {
    if (!ready) {
      toast({
        title: 'Model not ready',
        description: 'Please load the model before starting transcription.',
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recorder.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        audioChunks.current = [];
        await transcribe(audioBlob);
        if (isTranscribing) {
           // If still transcribing, start a new recording chunk
           recorder.current?.start(CHUNK_LENGTH_SECONDS * 1000);
        }
      };

      mediaRecorder.start(CHUNK_LENGTH_SECONDS * 1000); // Record in chunks
      setIsTranscribing(true);
      setTranscript('');
      toast({ title: 'Recording Started', description: 'Transcription has begun.' });
    } catch (e) {
      console.error('Failed to start recording', e);
      toast({
        variant: 'destructive',
        title: 'Recording Error',
        description: 'Could not access microphone.',
      });
    }
  }, [ready, isTranscribing]);

  const stopTranscription = useCallback(() => {
    if (recorder.current && recorder.current.state === 'recording') {
      recorder.current.onstop = async () => {
         const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
         audioChunks.current = [];
         await transcribe(audioBlob);

         // This is the final stop, so don't restart.
         setIsTranscribing(false);
         toast({ title: 'Recording Stopped' });
      }
      recorder.current.stop();
    } else {
        setIsTranscribing(false);
    }
  }, []);

  const transcribe = useCallback(async (audioBlob: Blob) => {
    if (!model) return;

    try {
        const audioContext = new AudioContext({
            sampleRate: 16000
        });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const pcmData = audioBuffer.getChannelData(0);
        
        const result = await model(pcmData, {
            chunk_length_s: CHUNK_LENGTH_SECONDS,
            batch_size: BATCH_SIZE,
            language: 'spanish',
            task: 'transcribe',
        });

        if (result && typeof result === 'object' && 'text' in result) {
            setTranscript(prev => prev + result.text + ' ');
        }
    } catch (e) {
        console.error('Transcription error', e);
        toast({
            variant: 'destructive',
            title: 'Transcription Error',
            description: 'Could not process the audio chunk.',
        });
    }
  }, [model]);
  

  const memoizedValues = useMemo(() => ({
    transcript,
    isTranscribing,
    loadingModel: loading,
    modelReady: ready,
    loadModel,
    startTranscription,
    stopTranscription,
  }), [transcript, isTranscribing, loading, ready, loadModel, startTranscription, stopTranscription]);

  return memoizedValues;
}
