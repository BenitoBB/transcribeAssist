'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function StudentPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Link href="/" className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
      </Link>
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Vista del Alumno</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          La transcripción de la clase aparecerá a continuación.
        </p>
      </div>

      <Card className="w-full max-w-4xl h-[60vh] flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
          <CardTitle className="text-base font-semibold">Transcripción</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Copiar transcripción"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <ScrollArea className="h-full w-full p-4">
            <p className="text-sm text-muted-foreground">
              El texto de la transcripción aparecerá aquí...
            </p>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
