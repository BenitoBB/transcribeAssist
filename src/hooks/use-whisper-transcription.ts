// This hook is adapted from the 'react-use-whisper' library,
// which is licensed under the MIT License.
// https://github.com/chengsokdara/react-use-whisper/blob/main/src/index.ts

"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type Transcript = {
    blob?: Blob;
    text: string;
};

const timeSlice = 1_000;

class WhisperPipeline {
    static instance: any | null = null;
    static loading: boolean = false;
    static async getInstance(progress_callback?: Function) {
      if (this.instance === null && !this.loading) {
        this.loading = true;
        
        const { pipeline, env } = await import('@xenova/transformers');
        env.allowLocalModels = false;
        
        this.instance = await pipeline(
            'automatic-speech-recognition',
            'Xenova/whisper-tiny.en',
            { progress_callback }
        );
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
    
    const model = useRef<any | null>(null);
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
        if (recorder.current && chunks.current.length > 0) {
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
            try {
                stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                const rec = new MediaRecorder(stream.current);
                rec.addEventListener('dataavailable', onDataAvailable);
                rec.addEventListener('stop', onStop);
                rec.start(timeSlice);
                recorder.current = rec;
                setIsTranscribing(true);
            } catch(e) {
                console.error("Could not start recording", e);
            }
        }
    }, [isModelLoading, onDataAvailable, onStop]);


    const stopRecording = useCallback(() => {
        if (recorder.current && isTranscribing) {
            recorder.current.stop();
            stream.current?.getTracks().forEach((track) => track.stop());
            setIsTranscribing(false);
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
      if (isTranscribing && recorder.current) {
        interval = setInterval(() => {
          recorder.current?.requestData();
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
        const sliceToProcess = lastSlice.current;
        lastSlice.current = null;

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
              blob: sliceToProcess,
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
          }
        };
        reader.readAsArrayBuffer(sliceToProcess);
      };
  
      const interval = setInterval(transcribe, timeSlice);
  
      return () => {
        clearInterval(interval);
      };
    }, [model]);

    return {
        isTranscribing,
        isModelLoading,
        transcript,
        startTranscription,
        stopTranscription,
    };
}
