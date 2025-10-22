'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

type Pipeline = (...args: any[]) => any;
type AutomaticSpeechRecognitionPipeline = any;
type Env = {
  allowLocalModels: boolean;
  allowRemoteModels: boolean;
};

const CHUNK_LENGTH_SECONDS = 30;

export function useWhisperTranscription() {
  const [model, setModel] = useState<AutomaticSpeechRecognitionPipeline | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const transformers = useRef<any>(null);

  const loadModel = useCallback(async () => {
    if (loadingModel || modelReady) return;
    setLoadingModel(true);
    try {
      if (!transformers.current) {
        const trans = await import('@xenova/transformers');
        (trans.env as Env).allowLocalModels = false;
        (trans.env as Env).allowRemoteModels = true;
        transformers.current = trans;
      }

      const pipeline = transformers.current.pipeline;
      const pipe = await pipeline('automatic-speech-recognition', 'openai/whisper-base');
      setModel(() => pipe);
      setModelReady(true);
      toast({
        title: 'Modelo de IA Cargado',
        description: 'El motor de transcripción está listo para usarse.',
      });
    } catch (e) {
      console.error('Failed to load model', e);
      toast({
        variant: 'destructive',
        title: 'Error al Cargar el Modelo',
        description: 'No se pudo cargar el modelo de IA de Whisper.',
      });
    } finally {
      setLoadingModel(false);
    }
  }, [loadingModel, modelReady, toast]);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  const transcribe = useCallback(
    async (audioBlob: Blob) => {
      if (!model || audioBlob.size === 0) return;

      try {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const pcmData = audioBuffer.getChannelData(0);

        const result = await model(pcmData, {
          chunk_length_s: CHUNK_LENGTH_SECONDS,
          language: 'spanish',
          task: 'transcribe',
        });
        
        if (result && typeof result === 'object' && 'text' in result && typeof result.text === 'string') {
          setTranscript(prev => prev + result.text);
        }
      } catch (e) {
        console.error('Transcription error', e);
      }
    },
    [model]
  );
  
  const startTranscription = useCallback(async () => {
    if (!modelReady) {
      toast({
        title: 'Modelo no listo',
        description: 'Por favor, espera a que el modelo de IA se cargue.',
      });
      return;
    }
    if (recorder.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if(event.data.size > 0) {
            audioChunks.current.push(event.data);
            const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
            transcribe(audioBlob);
            audioChunks.current = [];
        }
      };

      mediaRecorder.start(5000); // Process audio every 5 seconds
      setIsTranscribing(true);
      setTranscript('');
      toast({ title: 'Grabación iniciada', description: 'La transcripción ha comenzado.' });
    } catch (e) {
      console.error('Failed to start recording', e);
      toast({
        variant: 'destructive',
        title: 'Error de Micrófono',
        description: 'No se pudo acceder al micrófono. Revisa los permisos.',
      });
    }
  }, [modelReady, transcribe, toast]);

  const stopTranscription = useCallback(() => {
    if (recorder.current && recorder.current.state === 'recording') {
      recorder.current.stop();
      recorder.current.stream.getTracks().forEach(track => track.stop());
      recorder.current = null;
      setIsTranscribing(false);
      toast({ title: 'Grabación detenida' });
    }
  }, [toast]);

  return {
    transcript,
    setTranscript, // For student view
    isTranscribing,
    loadingModel,
    modelReady,
    startTranscription,
    stopTranscription,
  };
}
