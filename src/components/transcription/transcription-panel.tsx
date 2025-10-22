'use client';

import { Rnd } from 'react-rnd';
import { Textarea } from '../ui/textarea';
import { useApp } from '@/context/app-context';
import { Button } from '../ui/button';
import { Download, Mic, Settings, Square } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function TranscriptionPanel() {
  const { role, transcript, isTranscribing, startTranscription, stopTranscription, isPeerConnected } = useApp();

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcripcion.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Rnd
      default={{
        x: 0,
        y: window.innerHeight - 250,
        width: '100%',
        height: 250,
      }}
      minHeight={150}
      maxHeight={window.innerHeight - 100}
      bounds="parent"
      enableResizing={{
        top: true,
        right: false,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      className="bg-white border-t-4 border-blue-500 shadow-2xl rounded-t-lg overflow-hidden"
    >
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-2 bg-gray-100 border-b">
          <div className="flex items-center gap-4">
             {role === 'teacher' && (
              <>
                {!isTranscribing ? (
                  <Button onClick={startTranscription} size="sm" variant="outline">
                    <Mic className="mr-2" />
                    Iniciar Transcripción
                  </Button>
                ) : (
                  <Button onClick={stopTranscription} size="sm" variant="destructive">
                    <Square className="mr-2" />
                    Detener
                  </Button>
                )}
                 <Badge variant={isPeerConnected ? 'default' : 'destructive'} className={isPeerConnected ? 'bg-green-500' : ''}>
                  {isPeerConnected ? 'Estudiante Conectado' : 'Esperando Conexión'}
                </Badge>
              </>
            )}
             {role === 'student' && (
                <Badge variant={isPeerConnected ? 'default' : 'destructive'} className={isPeerConnected ? 'bg-green-500' : ''}>
                  {isPeerConnected ? 'Conectado al Maestro' : 'Conectando...'}
                </Badge>
             )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} variant="ghost" size="icon" title="Descargar Transcripción">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" title="Ajustes">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <Textarea
          value={transcript}
          readOnly={role === 'student'}
          className="flex-grow text-lg leading-relaxed p-4 border-0 rounded-none resize-none focus-visible:ring-0"
          placeholder={role === 'teacher' ? "La transcripción aparecerá aquí..." : "Esperando transcripción del maestro..."}
        />
      </div>
    </Rnd>
  );
}
