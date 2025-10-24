'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function useWhisperTranscription() {
  // Transcription state
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  // MediaRecorder state
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  // Web Worker reference
  const workerRef = useRef<Worker | null>(null);

  // Initialize the Web Worker
  useEffect(() => {
    if (!workerRef.current) {
        workerRef.current = new Worker(new URL('@/lib/transcription-worker.ts', import.meta.url), {
            type: 'module'
        });
    }

    const onMessageReceived = (e: MessageEvent) => {
        switch (e.data.status) {
            case 'loading':
                toast({
                    title: 'Cargando modelo de IA...',
                    description: 'Esto puede tardar un momento. Solo se hará una vez.',
                });
                break;
            case 'ready':
                setModelReady(true);
                toast({
                    title: 'Modelo de IA Cargado',
                    description: 'El motor de transcripción está listo para usarse.',
                });
                break;
            case 'result':
                const newText = e.data.output.text;
                setTranscript(newText); // This will hold the latest chunk for sending via WebRTC
                setFullTranscript(prev => prev + newText); // This accumulates the whole text for the teacher's view
                break;
            case 'error':
                 toast({
                    variant: 'destructive',
                    title: 'Error de Transcripción',
                    description: e.data.data,
                });
                break;
        }
    };

    workerRef.current.addEventListener('message', onMessageReceived);

    // Clean up
    return () => workerRef.current?.removeEventListener('message', onMessageReceived);
  }, []);

  const startTranscription = useCallback(async () => {
    if (!workerRef.current) return;
    
    // First, message the worker to load the model if it hasn't already.
    // The worker will manage the ready state.
    if (!modelReady) {
       workerRef.current.postMessage({ type: 'load' });
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audio = {
            // @ts-ignore
            buffer: arrayBuffer,
            sampling_rate: 16000 // Whisper expects 16kHz
        };
        workerRef.current?.postMessage({ type: 'transcribe', audio: audio });
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
  }, [isTranscribing, modelReady]);

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
