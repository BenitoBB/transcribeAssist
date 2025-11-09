'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranscription } from '@/hooks/use-transcription';
import { useStyle } from '@/context/StyleContext';

export default function StudentPage() {
  const { transcription } = useTranscription();
  const { style, themeClass } = useStyle();

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 ${themeClass}`}>
      <Link href="/" className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
      </Link>
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Vista del Alumno</h1>
        <p className="mt-2 text-sm sm:text-base">
          La transcripción de la clase aparecerá a continuación.
        </p>
      </div>

      <Card className="w-full max-w-4xl h-[60vh] flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
          <CardTitle className="text-base font-semibold">Transcripción</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <ScrollArea className="h-full w-full">
            <div
              className="p-4 prose"
              style={{
                fontSize: `${style.fontSize}px`,
                lineHeight: style.lineHeight,
                letterSpacing: `${style.letterSpacing}px`,
                fontFamily: style.fontFamily,
                color: 'var(--custom-text-color)',
                backgroundColor: 'var(--custom-background-color)',
                height: '100%',
              }}
            >
              <p>{transcription}</p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
