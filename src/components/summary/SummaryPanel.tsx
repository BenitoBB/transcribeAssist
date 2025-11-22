'use client';

import { useState, useEffect, useTransition } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, X, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { summarizeText } from './summarize-text-flow';

interface SummaryPanelProps {
  textToSummarize: string;
  onClose: () => void;
}

export function SummaryPanel({
  textToSummarize,
  onClose,
}: SummaryPanelProps) {
  const [summary, setSummary] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [size, setSize] = useState({ width: 500, height: 400 });
  const [pos, setPos] = useState({ x: 150, y: 150 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleGenerateSummary = () => {
    setError(null);
    setSummary('');
    startTransition(async () => {
      if (!textToSummarize || textToSummarize.trim().length < 50) {
        setError('No hay suficiente texto para generar un resumen.');
        return;
      }
      try {
        const result = await summarizeText({ text: textToSummarize });
        if (result.summary) {
          setSummary(result.summary);
        } else {
          setError('No se pudo generar el resumen.');
        }
      } catch (e) {
        console.error(e);
        setError('Ocurrió un error al generar el resumen.');
      }
    });
  };

  const renderContent = () => (
    <ScrollArea className="h-full">
      <div className="p-4 prose prose-sm dark:prose-invert">
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[75%]" />
            <Skeleton className="h-4 w-[85%]" />
          </div>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : summary ? (
          <div
            dangerouslySetInnerHTML={{
              __html: summary.replace(/\n/g, '<br />'),
            }}
          />
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <p>
              Haz clic en "Generar Resumen" para obtener una síntesis del texto
              de la transcripción.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  const panel = (
    <Card className="h-full w-full flex flex-col shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <GripVertical className="text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Resumen de la Clase</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleGenerateSummary} disabled={isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generar Resumen
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        {renderContent()}
      </CardContent>
    </Card>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full h-[70vh]">{panel}</div>
      </div>
    );
  }

  return (
    <Rnd
      size={size}
      position={pos}
      onDragStop={(e, d) => setPos({ x: d.x, y: d.y })}
      onResizeStop={(e, dir, ref, delta, position) => {
        setSize({
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
        });
        setPos(position);
      }}
      bounds="parent"
      dragHandleClassName="drag-handle"
      className="z-40 pointer-events-auto"
    >
      {panel}
    </Rnd>
  );
}
