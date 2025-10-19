// This hook is adapted from the 'react-use-whisper' library,
// which is licensed under the MIT License.
// https://github.com/chengsokdara/react-use-whisper/blob/main/src/index.ts

"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {env, pipeline, Pipeline, AutomaticSpeechRecognitionPipeline} from '@xenova/transformers';

// Skip local model check
env.allowLocalModels = false;

type WhisperOptions = {
    model?: string;
    multilingual?: boolean;
    quantized?: boolean;
    subtask?: 'transcribe' | 'translate';
    language?: string;
}

type Transcript = {
    blob?: Blob;
    text: string;
};

type UseWhisperConfig = {
    apiKey?: string;
    autoStart?: boolean;
    autoTranscribe?: boolean;
    mode?: 'transcriptions' | 'translations';
    nonStop?: boolean;
    removeSilence?: boolean;
    stopTimeout?: number;
    streaming?: boolean;
    timeSlice?: number;
    whisperConfig?: WhisperOptions;
    onTranscribe?: (blob: Blob) => Promise<Transcript>;
};

const stopTimeout = 5_000;
const timeSlice = 1_000;

class WhisperPipeline {
    static instance: AutomaticSpeechRecognitionPipeline | null = null;
    static loading: boolean = false;
    static async getInstance(progress_callback?: Function) {
      if (this.instance === null && !this.loading) {
        this.loading = true;
        this.instance = await pipeline(
            'automatic-speech-recognition',
            'Xenova/whisper-tiny.en',
            { progress_callback }
        ) as AutomaticSpeechRecognitionPipeline;
        this.loading = false;
      }
      return this.instance;
    }
}

export function useWhisperTranscription() {
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState<Transcript[]>([]);
    
    const stream = useRef<MediaStream | null>(null);
    const recorder = useRef<MediaRecorder | null>(null);
    const lastSlice = useRef<Blob | null>(null);
    const stopTimer = useRef<NodeJS.Timeout | null>(null);
    
    const model = useRef<AutomaticSpeechRecognitionPipeline | null>(null);
    const chunks = useRef<Blob[]>([]);

    useEffect(() => {
        const loadModel = async () => {
            model.current = await WhisperPipeline.getInstance();
            setIsModelLoading(false);
        }
        loadModel();
    }, []);

    const onDataAvailable = useCallback((e: BlobEvent) => {
        if (e.data.size > 0) {
            chunks.current.push(e.data);
            lastSlice.current = e.data;
        }
    }, []);

    const onStop = useCallback(async () => {
        if (recorder.current && lastSlice.current) {
            const blob = new Blob(chunks.current, {
                type: recorder.current.mimeType,
            });
            
            const audioCTX = new AudioContext();
            const reader = new FileReader();
            reader.onload = async () => {
                const audioData = await audioCTX.decodeAudioData(reader.result as ArrayBuffer);
                if (model.current) {
                    const output = await model.current(audioData, {
                        chunk_length_s: 30,
                        stride_length_s: 5,
                    });
                    const newTranscript: Transcript = {
                        blob,
                        text: output.text,
                    };
                    setTranscript((prev) => [...prev, newTranscript]);
                }
            };
            reader.readAsArrayBuffer(blob);
            chunks.current = [];
            lastSlice.current = null;
        }
    }, [model]);

    const startRecording = useCallback(async () => {
        if (!isModelLoading && model.current) {
            stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            const rec = new MediaRecorder(stream.current);
            rec.addEventListener('dataavailable', onDataAvailable);
            rec.addEventListener('stop', onStop);
            rec.start(timeSlice);
            recorder.current = rec;
            setIsTranscribing(true);
        }
    }, [isModelLoading, onDataAvailable, onStop]);


    const stopRecording = useCallback(() => {
        if (recorder.current && isTranscribing) {
            recorder.current.stop();
            stream.current?.getTracks().forEach((track) => track.stop());
            setIsTranscribing(false);
            if(stopTimer.current) {
                clearTimeout(stopTimer.current);
            }
        }
    }, [isTranscribing]);

    const startTranscription = useCallback(() => {
        setTranscript([]);
        startRecording();
    }, [startRecording]);

    const stopTranscription = useCallback(() => {
        stopRecording();
    }, [stopRecording]);

    useEffect(() => {
      let interval: NodeJS.Timeout | null = null;
      if (isTranscribing) {
        interval = setInterval(() => {
          if (recorder.current) {
            recorder.current.requestData();
          }
        }, timeSlice);
      } else if (interval) {
        clearInterval(interval);
      }
  
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }, [isTranscribing]);


    useEffect(() => {
      const transcribe = async () => {
        if (!lastSlice.current || !model.current) {
            return;
        }
        const audioCTX = new AudioContext({ sampleRate: 16000 });
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const audioData = await audioCTX.decodeAudioData(reader.result as ArrayBuffer);
            const output = await model.current!(audioData, {
              chunk_length_s: 30,
              stride_length_s: 5,
            });
            const newTranscript: Transcript = {
              blob: lastSlice.current!,
              text: output.text,
            };
             setTranscript((prev) => {
                const newArr = [...prev];
                // simple diffing
                if(newArr.length > 0 && newArr[newArr.length -1].text.trim() === newTranscript.text.trim()) {
                    return newArr;
                }
                if (newArr.length > 0 && newTranscript.text.startsWith(newArr[newArr.length -1].text)) {
                    newArr[newArr.length - 1] = newTranscript;
                    return newArr;
                }
                return [...newArr, newTranscript];
             });
          } catch (e) {
            console.error(e);
          } finally {
            lastSlice.current = null;
          }
        };
        reader.readAsArrayBuffer(lastSlice.current);
      };
  
      const interval = setInterval(transcribe, timeSlice);
  
      return () => {
        clearInterval(interval);
      };
    }, [lastSlice, model]);

    return {
        isTranscribing,
        isModelLoading,
        transcript,
        startTranscription,
        stopTranscription,
    };
}
