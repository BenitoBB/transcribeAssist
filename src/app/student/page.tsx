'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function StudentPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Link href="/" className="absolute top-8 left-8">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
      </Link>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Vista del Alumno</h1>
        <p className="text-gray-600 mt-2">
          La transcripción de la clase aparecerá a continuación.
        </p>
      </div>

      <Card className="w-full max-w-4xl h-[400px] flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
          <CardTitle className="text-base">Transcripción</CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-grow overflow-auto">
          <p className="text-sm text-muted-foreground">
            El texto de la transcripción aparecerá aquí...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
