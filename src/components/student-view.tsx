'use client';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useApp } from '@/context/app-context';
import TranscriptionPanel from './transcription/transcription-panel';

export function StudentView() {
  const { setSessionId, sessionId, role } = useApp();
  const [inputSessionId, setInputSessionId] = useState('');

  const handleJoinSession = () => {
    if (inputSessionId.trim()) {
      setSessionId(inputSessionId.trim().toUpperCase(), role);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full -mt-16">
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <h2 className="text-center text-2xl font-bold">Unirse a una Sesión</h2>
          <Input
            value={inputSessionId}
            onChange={(e) => setInputSessionId(e.target.value)}
            placeholder="Introduce el código de sesión (ej. ABC123)"
            className="text-center text-lg h-12"
          />
          <Button onClick={handleJoinSession} size="lg">
            Unirse
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
       <div className="bg-gray-100 p-3 border-b">
        <div className="container mx-auto flex justify-between items-center">
           <span className="font-semibold">Conectado a la sesión: {sessionId}</span>
        </div>
      </div>
       <div className="flex-1 bg-white relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-300 text-4xl font-bold">Esperando Transcripción...</p>
        </div>
      </div>
      <TranscriptionPanel />
    </div>
  );
}
