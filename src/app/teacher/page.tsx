'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowLeft } from 'lucide-react';
import { TranscriptionPanel } from './components/TranscriptionPanel';

export default function TeacherPage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
        <Link href="/">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Volver a la página principal</p>
            </TooltipContent>
          </Tooltip>
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
