'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TranscriptionPanel } from './components/TranscriptionPanel';
import { useStyle } from '@/context/StyleContext';

export default function TeacherPage() {
  const { themeClass } = useStyle();

  return (
    <div className={`relative h-screen w-screen overflow-hidden ${themeClass}`}>
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
        </Link>
      </div>
      <div className="p-4 h-full w-full">
        <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">Vista del Maestro</h1>
            <p className="mt-2 text-sm sm:text-base">
                Aquí puedes mover y redimensionar el panel de transcripción.
            </p>
        </div>
        <TranscriptionPanel />
      </div>
    </div>
  );
}
