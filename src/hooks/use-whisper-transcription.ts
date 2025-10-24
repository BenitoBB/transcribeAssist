'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';

// Define types dynamically to avoid direct import issues on server
type Pipeline = (...args: any[]) => any;
type AutomaticSpeechRecognitionPipeline = any;

const CHUNK_LENGTH_SECONDS = 30;

export function useWhisperTranscription() {
  // Model state
  const [modelReady, setModelReady] = useState(false);
  const modelRef = useRef<AutomaticSpeechRecognitionPipeline | null>(null);
  
  // Using a ref for transformers library to ensure it's only loaded once.
  const transformersRef = useRef<any>(null);

  // Transcription state
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // MediaRecorder state
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Function to load the model on demand
  const loadModel = useCallback(async () => {
    if (modelRef.current) {
        return modelRef.current;
    }

    try {
        toast({
            title: 'Cargando modelo de IA...',
            description: 'Esto puede tardar un momento. Solo se hará una vez.',
        });
        
        // Dynamically import transformers.js only when needed
        if (!transformersRef.current) {
          const trans = await import('@xenova/transformers');
          transformersRef.current = trans;
        }

        const pipeline = transformersRef.current.pipeline;
        const pipe = await pipeline('automatic-speech-recognition', 'openai/whisper-base');
        
        modelRef.current = pipe;
        setModelReady(true);
        toast({
            title: 'Modelo de IA Cargado',
            description: 'El motor de transcripción está listo para usarse.',
        });
        return pipe;
    } catch (e) {
        console.error('Failed to load model', e);
        toast({
            variant: 'destructive',
            title: 'Error al Cargar el Modelo',
            description: 'No se pudo cargar el modelo de IA de Whisper.',
        });
        return null;
    }
  }, []);

  const transcribe = useCallback(async (audioBlob: Blob) => {
    if (!modelRef.current || audioBlob.size === 0) return;

    try {
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const pcmData = audioBuffer.getChannelData(0);

      const result = await modelRef.current(pcmData, {
        chunk_length_s: CHUNK_LENGTH_SECONDS,
        language: 'spanish',
        task: 'transcribe',
      });
      
      if (result && typeof result === 'object' && 'text' in result && typeof result.text === 'string') {
        setTranscript(result.text); // This will hold the latest chunk for sending via WebRTC
        setFullTranscript(prev => prev + result.text); // This accumulates the whole text for the teacher's view
      }
    } catch (e) {
      console.error('Transcription error', e);
    }
  }, []);

  const startTranscription = useCallback(async () => {
    const model = await loadModel();
    if (!model) {
        return;
    }

    if (recorderRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if(event.data.size > 0) {
            audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        transcribe(audioBlob);
        audioChunks.current = [];
        if (isTranscribing) { // If still transcribing, start it again
            recorderRef.current?.start(5000);
        }
      }

      mediaRecorder.start(5000); // Process audio every 5 seconds
      setIsTranscribing(true);
      setTranscript('');
      setFullTranscript('');
      toast({ title: 'Grabación iniciada', description: 'La transcripción ha comenzado.' });
    } catch (e) {
      console.error('Failed to start recording', e);
      toast({
        variant: 'destructive',
        title: 'Error de Micrófono',
        description: 'No se pudo acceder al micrófono. Revisa los permisos.',
      });
    }
  }, [loadModel, transcribe, isTranscribing]);

  const stopTranscription = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
      recorderRef.current.stream.getTracks().forEach(track => track.stop());
      recorderRef.current = null;
      setIsTranscribing(false);
      toast({ title: 'Grabación detenida' });
    }
  }, []);

  return {
    transcript, // This is the new chunk
    fullTranscript, // This is the accumulated text
    startTranscription,
    stopTranscription,
    isTranscribing,
    modelReady,
  };
}
