'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, MoreVertical, Copy, FileDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranscription } from '@/hooks/use-transcription';
import { useStyle } from '@/context/StyleContext';
import { useToast } from '@/hooks/use-toast';
import { SettingsButton } from '@/components/settings/SettingsButton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';
import { TextWithDefinitions } from '@/components/TextWithDefinitions';


export default function StudentPage() {
  const { transcription } = useTranscription();
  const { style } = useStyle();
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    toast({
      title: 'Copiado',
      description: 'La transcripción ha sido copiada al portapapeles.',
    });
  };

  const handleSave = () => {
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcripcion.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
        title: 'Guardado',
        description: 'La transcripción se está descargando como transcripcion.txt.',
      });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-4">
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

      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Vista del Alumno</h1>
        <p className="mt-2 text-sm sm:text-base">
          Haz doble clic en una palabra para ver su definición.
        </p>
      </div>

      <Card className="w-full max-w-4xl h-[60vh] flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
          <CardTitle className="text-base font-semibold">
            Transcripción
          </CardTitle>
          <div className="flex items-center gap-2">
            <SettingsButton />
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Más opciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Más opciones</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copiar al portapapeles</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSave}>
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>Guardar como .txt</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <ScrollArea className="h-full w-full">
            <div
              className="p-4 prose bg-transparent"
              style={{
                fontSize: `${style.fontSize}px`,
                lineHeight: style.lineHeight,
                letterSpacing: `${style.letterSpacing}px`,
                fontFamily: style.fontFamily,
                color: 'inherit',
              }}
            >
              <TextWithDefinitions text={transcription} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
