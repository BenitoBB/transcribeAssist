'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useApp } from '@/context/app-context';
import { nanoid } from 'nanoid';
import { Copy, Mic, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TranscriptionPanel from './transcription/transcription-panel';

export function TeacherView() {
  const { setSessionId, role } = useApp();
  const [localSessionId, setLocalSessionId] = useState('');
  const { toast } = useToast();

  const handleStartSession = () => {
    const newSessionId = nanoid(6).toUpperCase();
    setLocalSessionId(newSessionId);
    setSessionId(newSessionId, role);
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(localSessionId);
    toast({
      title: 'Copiado',
      description: 'El código de la sesión ha sido copiado al portapapeles.',
    });
  };

  if (!localSessionId) {
    return (
      <div className="flex items-center justify-center h-full -mt-16">
        <Button onClick={handleStartSession} size="lg">
          Iniciar Nueva Sesión de Clase
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 p-3 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Código de Sesión:</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md font-mono text-lg">
              <span>{localSessionId}</span>
              <Button onClick={copySessionId} variant="ghost" size="icon">
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div>
            {/* Connection status can go here */}
          </div>
        </div>
      </div>
      <div className="flex-1 bg-white relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-300 text-4xl font-bold">Pizarrón</p>
        </div>
      </div>
      <TranscriptionPanel />
    </div>
  );
}
