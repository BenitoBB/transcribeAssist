'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ArrowLeft,
  Copy,
  FileDown,
  MoreVertical,
  Wifi,
  WifiOff,
  FileText,
  Pencil,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingsButton } from '@/components/settings/SettingsButton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useStyle } from '@/context/StyleContext';
import { useTranscription } from '@/hooks/use-transcription';
import { joinSession, onDataReceived, onConnectionStatusChange, ConnectionStatus } from '@/lib/p2p';
import { BionicReadingText } from '@/components/BionicReadingText';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function StudentPage() {
  const { transcription, setTranscription } = useTranscription();
  const { style, isBionic, showRuler } = useStyle();
  const { toast } = useToast();

  const [rulerY, setRulerY] = useState<number>(0);

  const handleContentMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!transcriptionDisplayRef.current) return;
    const rect = transcriptionDisplayRef.current.getBoundingClientRect();
    const scrollTop = transcriptionDisplayRef.current.scrollTop;
    const y = e.clientY - rect.top + scrollTop;
    setRulerY(y);
  };

  const [sessionId, setSessionId] = useState('');
  const transcriptionDisplayRef = useRef<HTMLDivElement>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const hasConnected = useRef(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Metadata de la clase
  const [className, setClassName] = useState('');
  const [isEditingClassName, setIsEditingClassName] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const classNameInputRef = useRef<HTMLInputElement>(null);

  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubData = onDataReceived((data: any) => {
      console.debug('p2p data received in student:', data);
      if (data.type === 'full_text') {
        setTranscription(data.text);
      }
      if (data.type === 'recording_started' && data.timestamp) {
        // Solo establecer la hora de inicio la primera vez
        setStartTime(prev => prev ?? new Date(data.timestamp));
      }
    });

    const unsubStatus = onConnectionStatusChange(status => {
      setConnectionStatus(status);
      if (status === 'connected') {
        hasConnected.current = true;
        setTranscription('');
        toast({
          title: 'Conectado a la sala',
          description: 'Recibiendo transcripción...',
        });
      } else if (status === 'error') {
        toast({
          variant: 'destructive',
          title: 'Sala no encontrada',
          description: 'No pudimos encontrar una sala con ese ID, o el maestro ya se desconectó.',
        });
      }
    });

    return () => {
      unsubData();
      unsubStatus();
    };
  }, [setTranscription]);

  // Generar el encabezado de metadata para exportaciones de texto
  const buildTextHeader = (endTime: Date): string => {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════');
    lines.push('  TRANSCRIPCIÓN DE CLASE');
    lines.push('═══════════════════════════════════════════');
    if (className) lines.push(`  Clase: ${className}`);
    lines.push(`  Sala: ${sessionId}`);
    lines.push(`  Fecha: ${formatDate(endTime)}`);
    if (startTime) lines.push(`  Hora de inicio: ${formatTime(startTime)}`);
    lines.push(`  Hora de finalización: ${formatTime(endTime)}`);
    lines.push('═══════════════════════════════════════════');
    lines.push('');
    return lines.join('\n');
  };

  const handleCopy = () => {
    const endTime = new Date();
    const header = buildTextHeader(endTime);
    navigator.clipboard.writeText(header + transcription);
    toast({
      title: 'Copiado',
      description: 'La transcripción ha sido copiada al portapapeles.',
    });
  };

  const handleSave = () => {
    const endTime = new Date();
    const header = buildTextHeader(endTime);
    const blob = new Blob([header + transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = className
      ? `transcripcion-${className.replace(/\s+/g, '_')}.txt`
      : 'transcripcion.txt';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Guardado',
      description: `La transcripción se está descargando como ${fileName}.`,
    });
  };

  const handleExportToPdf = async () => {
    const element = transcriptionDisplayRef.current;
    if (!element) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo encontrar el contenido de la transcripción.',
      });
      return;
    }

    const endTime = new Date();

    toast({
      title: 'Generando PDF...',
      description: 'Por favor, espera un momento.',
    });

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    // Título
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const title = className
      ? `Transcripcion: ${className}`
      : 'Transcripcion de la Clase';
    pdf.text(title, margin, margin);

    // Metadata
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let metaY = margin + 8;
    pdf.text(`Fecha: ${formatDate(endTime)}`, margin, metaY);
    metaY += 4;
    pdf.text(`Sala: ${sessionId}`, margin, metaY);
    metaY += 4;
    if (startTime) {
      pdf.text(`Hora de inicio: ${formatTime(startTime)}`, margin, metaY);
      metaY += 4;
    }
    pdf.text(`Hora de finalizacion: ${formatTime(endTime)}`, margin, metaY);
    metaY += 4;

    pdf.setLineWidth(0.5);
    pdf.line(margin, metaY + 2, pageWidth - margin, metaY + 2);

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = metaY + 7;

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - position - margin);

    while (heightLeft > 0) {
      position = -heightLeft - margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);
    }

    const fileName = className
      ? `transcripcion-${className.replace(/\s+/g, '_')}.pdf`
      : `transcripcion-${sessionId}.pdf`;
    pdf.save(fileName);

    toast({
      title: 'PDF Generado',
      description: 'La descarga de tu transcripción ha comenzado.',
    });
  };

  const handleConnect = () => {
    const id = sessionId.trim().toLowerCase();
    if (id) {
      joinSession(id);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, introduce un ID de sala válido.',
      });
    }
  };

  const handleClassNameSubmit = () => {
    setIsEditingClassName(false);
  };

  // Función para renderizar el texto con resaltado de búsqueda
  const renderHighlightedText = (textToRender: string) => {
    if (!textToRender) return "Esperando transcripción del maestro...";
    if (!searchQuery.trim()) {
      return isBionic ? <BionicReadingText text={textToRender} /> : textToRender;
    }

    const query = searchQuery.trim().toLowerCase();

    // Función auxiliar para resaltar dentro de una cadena normal
    const highlightString = (str: string) => {
      const parts = str.split(new RegExp(`(${query})`, 'gi'));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === query ? (
              <mark key={i} className="bg-yellow-300 text-black px-1 rounded" id={i === 1 ? 'first-search-match' : undefined}>{part}</mark>
            ) : part
          )}
        </>
      );
    };

    if (isBionic) {
      // Para bionic reading, separamos primero y luego resaltamos cada trozo
      const parts = textToRender.split(/(\s+)/);
      return (
        <>
          {parts.map((word, index) => {
            if (/\s+/.test(word)) return <React.Fragment key={index}>{word}</React.Fragment>;

            // Aplicar lógica bionic
            const mid = Math.ceil(word.length / 2);
            const boldPart = word.slice(0, mid);
            const normalPart = word.slice(mid);

            // Si la palabra entera incluye nuestra búsqueda buscamos la forma de resaltarla
            if (word.toLowerCase().includes(query)) {
              return (
                <mark key={index} className="bg-yellow-300 text-black px-0.5 rounded" id={index === 1 ? 'first-search-match' : undefined}>
                  <span className="font-bold">{boldPart}</span>{normalPart}
                </mark>
              );
            }

            // Si no, renderizado normal bionic
            return (
              <React.Fragment key={index}>
                <span className="font-bold">{boldPart}</span>{normalPart}
              </React.Fragment>
            );
          })}
        </>
      )
    }

    return highlightString(textToRender);
  };

  // Auto-scroll al primer resultado cuando se busca
  useEffect(() => {
    if (searchQuery.trim()) {
      const match = document.getElementById('first-search-match');
      if (match) {
        match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchQuery, transcription]);


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
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

      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <div className={`flex items-center gap-2 text-sm ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus === 'connected' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span>{connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estado de la conexión</p>
          </TooltipContent>
        </Tooltip>
        <SettingsButton />
      </div>

      {!hasConnected.current ? (
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Unirse a una Sala</h1>
          <p className="text-muted-foreground">Introduce el ID de la sala proporcionado por el maestro.</p>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="ID de la Sala (5 caracteres, minúsculas)"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value.toLowerCase())}
              className="text-center"
            />
            <Button onClick={handleConnect} disabled={connectionStatus === 'connecting'}>
              {connectionStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
            </Button>
          </div>
          {connectionStatus === 'error' && (
            <p className="text-sm text-destructive">No se pudo conectar a la sala. Verifica el ID y la conexión.</p>
          )}
        </div>
      ) : (
        <>
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Vista del Alumno</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Viendo la transcripción de la sala: <span className="font-mono text-primary">{sessionId}</span>
            </p>
          </div>

          {/* Nombre de la clase y metadata */}
          <div className="w-full max-w-4xl mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isEditingClassName ? (
                <Input
                  ref={classNameInputRef}
                  type="text"
                  placeholder="Nombre de la clase"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  onBlur={handleClassNameSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleClassNameSubmit()}
                  className="w-64 h-8 text-sm"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingClassName(true)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <Pencil className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                  <span className={className ? 'text-foreground font-medium' : 'italic'}>
                    {className || 'Agregar nombre de clase...'}
                  </span>
                </button>
              )}
            </div>
            {startTime && (
              <span className="text-xs text-muted-foreground">
                Inicio: {formatTime(startTime)}
              </span>
            )}
          </div>

          <Card className="w-full max-w-4xl h-[60vh] flex flex-col shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b gap-4">
              <CardTitle className="text-base font-semibold whitespace-nowrap">
                Transcripción
              </CardTitle>

              {/* Barra de Búsqueda */}
              <div className="flex-1 flex justify-end max-w-xs ml-auto items-center">
                {isSearching ? (
                  <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-right-4 duration-200">
                    <Input
                      ref={searchInputRef}
                      type="search"
                      placeholder="Buscar en el texto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 text-sm w-full"
                      autoFocus
                      onBlur={() => !searchQuery && setIsSearching(false)}
                    />
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setIsSearching(true)} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                    <Search className="h-4 w-4 mr-2" />
                    <span className="text-sm">Buscar</span>
                  </Button>
                )}
              </div>

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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSave}>
                    <FileDown className="mr-2 h-4 w-4" />
                    <span>Guardar como .txt</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleExportToPdf}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Exportar como PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="p-0 flex-grow overflow-hidden min-h-0">
              <ScrollArea className="h-full w-full">
                <div
                  ref={transcriptionDisplayRef}
                  className="p-6 break-words bg-background relative"
                  onMouseMove={showRuler ? handleContentMouseMove : undefined}
                  style={{
                    ...style,
                    minHeight: '100%',
                    color: 'var(--foreground)',
                  }}
                >
                  {renderHighlightedText(transcription)}
                  {showRuler && (
                    <div
                      className="absolute left-0 right-0 bg-yellow-200/40 pointer-events-none"
                      style={{
                        top: rulerY - style.fontSize * style.lineHeight / 2,
                        height: style.fontSize * style.lineHeight,
                      }}
                    />
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

    </div>
  );
}