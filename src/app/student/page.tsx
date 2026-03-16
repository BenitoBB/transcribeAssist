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
  Highlighter,
  NotebookPen,
  Eraser,
} from 'lucide-react';

export type HighlightColor = 'amarillo' | 'verde' | 'rojo';

interface Highlight {
  text: string;
  color: HighlightColor;
}

import { cn } from '@/lib/utils';
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
import { useRouter } from 'next/navigation';
import { SettingsButton } from '@/components/settings/SettingsButton';
import { ExitConfirmation } from '@/components/ExitConfirmation';
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
import { NotesPanel } from './components/NotesPanel';

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
  const { style, isBionic, showRuler, theme } = useStyle();
  const { toast } = useToast();
  const router = useRouter();

  const [rulerY, setRulerY] = useState<number>(0);

  const handleContentMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!transcriptionDisplayRef.current) return;
    const rect = transcriptionDisplayRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setRulerY(y);
  };

  const [sessionId, setSessionId] = useState('');
  const transcriptionDisplayRef = useRef<HTMLDivElement>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const hasConnected = useRef(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Metadata de la clase
  const [className, setClassName] = useState('');
  const [isEditingClassName, setIsEditingClassName] = useState(false);
  const classNameInputRef = useRef<HTMLInputElement>(null);

  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Panel de Notas
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notesSide, setNotesSide] = useState<'left' | 'right'>('right');
  const [notesContent, setNotesContent] = useState('');

  const [isMobile, setIsMobile] = useState(false);

  // Marcatextos / Highlights
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  // Function to resolve highlight colors based on theme
  const getThemeHighlightColor = (baseColor: HighlightColor): { bg: string; text: string; label: string; hex: string } => {
    if (theme === 'protanopia' || theme === 'deuteranopia') {
      if (baseColor === 'amarillo') return { bg: 'bg-blue-200', text: 'text-blue-900', label: 'Azul', hex: '#bfdbfe' };
      if (baseColor === 'verde') return { bg: 'bg-orange-200', text: 'text-orange-900', label: 'Naranja', hex: '#fed7aa' };
      if (baseColor === 'rojo') return { bg: 'bg-purple-200', text: 'text-purple-900', label: 'Morado', hex: '#e9d5ff' };
    }
    if (theme === 'dark') {
      if (baseColor === 'amarillo') return { bg: 'bg-yellow-500/40', text: 'text-yellow-100', label: 'Amarillo', hex: '#ca8a04' };
      if (baseColor === 'verde') return { bg: 'bg-green-500/40', text: 'text-green-100', label: 'Verde', hex: '#16a34a' };
      if (baseColor === 'rojo') return { bg: 'bg-red-500/40', text: 'text-red-100', label: 'Rojo', hex: '#dc2626' };
    }
    if (baseColor === 'amarillo') return { bg: 'bg-yellow-200', text: 'text-yellow-900', label: 'Amarillo', hex: '#fef08a' };
    if (baseColor === 'verde') return { bg: 'bg-green-200', text: 'text-green-900', label: 'Verde', hex: '#bbf7d0' };
    if (baseColor === 'rojo') return { bg: 'bg-red-200', text: 'text-red-900', label: 'Rojo', hex: '#fecaca' };

    return { bg: 'bg-yellow-200', text: 'text-yellow-900', label: 'Marcado', hex: '#fef08a' };
  };

  const handleApplyHighlight = (color: HighlightColor) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (text.length > 0) {
      setHighlights(prev => {
        if (prev.some(h => h.text === text && h.color === color)) return prev;
        return [...prev, { text, color }];
      });
      toast({
        title: 'Texto resaltado',
        description: `Se ha marcado con color ${getThemeHighlightColor(color).label}.`,
      });
    }
    selection.removeAllRanges();
  };

  const handleRemoveHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (text.length > 0) {
      setHighlights(prev => prev.filter(h => h.text.toLowerCase() !== text.toLowerCase()));
      toast({
        title: 'Marcador eliminado',
        description: 'Se ha quitado el resaltado del texto seleccionado.',
      });
    }
    selection.removeAllRanges();
  };

  useEffect(() => {
    const unsubData = onDataReceived((data: any) => {
      if (data.type === 'full_text') {
        setTranscription(data.text);
      }
      if (data.type === 'recording_started' && data.timestamp) {
        setStartTime(prev => prev ?? new Date(data.timestamp));
      }
    });

    const unsubStatus = onConnectionStatusChange(status => {
      setConnectionStatus(status);
      if (status === 'connected') {
        hasConnected.current = true;
        setTranscription('');
      } else if (status === 'error') {
        toast({
          variant: 'destructive',
          title: 'Sala no encontrada',
          description: 'No pudimos encontrar una sala con ese ID.',
        });
      }
    });

    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      unsubData();
      unsubStatus();
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [setTranscription, toast]);

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

  const getExportTextWithHighlights = () => {
    let exportText = transcription;
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
    sortedHighlights.forEach(h => {
      const label = getThemeHighlightColor(h.color).label;
      exportText = exportText.split(h.text).join(`[📌 ${label}: ${h.text}]`);
    });
    return exportText;
  };

  const handleCopy = () => {
    const endTime = new Date();
    const header = buildTextHeader(endTime);
    navigator.clipboard.writeText(header + getExportTextWithHighlights());
    toast({
      title: 'Copiado',
      description: 'Copiado al portapapeles.',
    });
  };

  const handleSave = () => {
    const endTime = new Date();
    const header = buildTextHeader(endTime);
    const blob = new Blob([header + getExportTextWithHighlights()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = className ? `transcripcion-${className.replace(/\s+/g, '_')}.txt` : 'transcripcion.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportToPdf = async () => {
    const element = transcriptionDisplayRef.current;
    if (!element) return;

    const endTime = new Date();
    toast({ title: 'Generando PDF...', description: 'Espera un momento.' });

    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: null });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(className ? `Transcripcion: ${className}` : 'Transcripcion de la Clase', margin, margin);

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
    pdf.addImage(imgData, 'PNG', margin, metaY + 7, imgWidth, imgHeight);

    const fileName = className ? `transcripcion-${className.replace(/\s+/g, '_')}.pdf` : `transcripcion-${sessionId}.pdf`;
    pdf.save(fileName);
  };

  const handleConnect = () => {
    const id = sessionId.trim().toLowerCase();
    if (id) joinSession(id);
    else toast({ variant: 'destructive', title: 'Error', description: 'ID de sala inválido.' });
  };

  const handleClassNameSubmit = () => setIsEditingClassName(false);

  const applyBionic = (str: string, keyPrefix: string) => {
    if (!isBionic) return str;
    return str.split(/(\s+)/).map((word, k) => {
      if (/\s+/.test(word)) return <React.Fragment key={`${keyPrefix}-${k}`}>{word}</React.Fragment>;
      const mid = Math.ceil(word.length / 2);
      return (
        <React.Fragment key={`${keyPrefix}-${k}`}>
          <span className="font-bold">{word.slice(0, mid)}</span>{word.slice(mid)}
        </React.Fragment>
      );
    });
  };

  const renderHighlightedText = (textToRender: string) => {
    if (!textToRender) return "Esperando transcripción...";

    const searchMatch = searchQuery.trim().toLowerCase();
    const matchers: { text: string; type: 'search' | HighlightColor }[] = [];

    if (searchMatch) matchers.push({ text: searchMatch, type: 'search' });

    [...highlights]
      .sort((a, b) => b.text.length - a.text.length)
      .forEach(h => {
        if (h.text.trim()) matchers.push({ text: h.text.toLowerCase(), type: h.color });
      });

    if (matchers.length === 0) return applyBionic(textToRender, 'base');

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = matchers.map(m => escapeRegExp(m.text)).join('|');
    const parts = textToRender.split(new RegExp(`(${regexPattern})`, 'gi'));
    let searchHitCount = 0;

    return (
      <>
        {parts.map((part, index) => {
          const lowerPart = part.toLowerCase();
          const matchedTheme = matchers.find(m => m.text === lowerPart);

          if (matchedTheme) {
            let cls = '';
            let id = undefined;

            if (matchedTheme.type === 'search') {
              cls = 'bg-yellow-300 text-black px-1 rounded shadow-sm';
              if (searchHitCount === 0) id = 'first-search-match';
              searchHitCount++;
            } else {
              const styles = getThemeHighlightColor(matchedTheme.type as HighlightColor);
              cls = `${styles.bg} ${styles.text} px-1 rounded transition-colors`;
            }

            return (
              <mark key={index} className={cls} id={id}>
                {applyBionic(part, `mark-${index}`)}
              </mark>
            );
          } else {
            return <React.Fragment key={index}>{applyBionic(part, `text-${index}`)}</React.Fragment>;
          }
        })}
      </>
    );
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const match = document.getElementById('first-search-match');
      if (match) match.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchQuery, transcription]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-4">
        <ExitConfirmation
          transcriptionText={transcription}
          notesContent={notesContent}
          hasOtherProgress={hasConnected.current}
          description="Si regresas a la página principal, se perderá el progreso de la transcripción y las notas tomadas en esta clase."
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isNotesOpen ? "default" : "outline"}
              size="icon"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className={isNotesOpen ? "bg-primary text-primary-foreground" : ""}
            >
              <NotebookPen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{isNotesOpen ? 'Cerrar Notas' : 'Ver mis Notas'}</p></TooltipContent>
        </Tooltip>
      </div>

      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2">
        {!isMobile && (
          <Tooltip>
            <TooltipTrigger>
              <div className={`flex items-center gap-2 text-sm ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus === 'connected' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span>{connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Estado de la conexión</p></TooltipContent>
          </Tooltip>
        )}
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
        </div>
      ) : (
        <>
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Vista del Alumno</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Sala: <span className="font-mono text-primary">{sessionId}</span>
            </p>
          </div>

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
            {startTime && <span className="text-xs text-muted-foreground">Inicio: {formatTime(startTime)}</span>}
          </div>

          <div className={cn(
            "flex w-full gap-4 items-stretch justify-center transition-all duration-300 min-h-0",
            isMobile ? "max-w-full flex-col h-[75vh]" : "max-w-7xl h-[60vh]",
            isNotesOpen && notesSide === 'left' && !isMobile ? 'flex-row-reverse' : !isMobile ? 'flex-row' : ''
          )}>
            <Card className={cn(
              "min-w-0 flex flex-col shadow-lg border-2",
              isMobile && isNotesOpen ? "h-[45%] shrink-0" : "flex-1 h-full"
            )}>
              <CardHeader className="p-3 border-b flex flex-row items-center justify-between gap-1 overflow-hidden shrink-0 h-14">
                <CardTitle className="text-sm font-bold truncate">Transcripción</CardTitle>
              </CardHeader>
              
              <div className="p-2 border-b bg-muted/30 flex flex-wrap items-center justify-between gap-1 shrink-0">
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={handleRemoveHighlight}
                      >
                        <Eraser className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Quitar marcador</TooltipContent>
                  </Tooltip>

                  <div className="w-px h-6 bg-border mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleApplyHighlight('amarillo')}>
                        <div className={`h-4 w-4 rounded-full border border-black/10 ${getThemeHighlightColor('amarillo').bg}`}></div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Amarillo</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleApplyHighlight('verde')}>
                        <div className={`h-4 w-4 rounded-full border border-black/10 ${getThemeHighlightColor('verde').bg}`}></div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Verde</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleApplyHighlight('rojo')}>
                        <div className={`h-4 w-4 rounded-full border border-black/10 ${getThemeHighlightColor('rojo').bg}`}></div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rojo</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-0.5 ml-auto">
                  {isSearching ? (
                    <Input
                      ref={searchInputRef}
                      type="search"
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 text-sm w-32"
                      autoFocus
                      onBlur={() => !searchQuery && setIsSearching(false)}
                    />
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSearching(true)}>
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Buscar</TooltipContent>
                    </Tooltip>
                  )}

                  <div className="w-px h-6 bg-border mx-1" />
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>.txt</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportToPdf}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Exportar PDF</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <CardContent className="p-0 flex-grow overflow-hidden bg-background">
                <ScrollArea className="h-full w-full">
                  <div
                    ref={transcriptionDisplayRef}
                    className="p-6 break-words relative"
                    onMouseMove={showRuler ? handleContentMouseMove : undefined}
                    style={{ ...style, minHeight: '100%', color: 'var(--foreground)' }}
                  >
                    {renderHighlightedText(transcription)}
                    {showRuler && (
                      <div 
                        className="absolute left-0 right-0 bg-primary/20 pointer-events-none z-10 border-y border-primary/30" 
                        style={{ 
                          top: rulerY - (style.fontSize * style.lineHeight) / 2, 
                          height: style.fontSize * style.lineHeight 
                        }} 
                      />
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {isNotesOpen && (
              <NotesPanel
                studentClassName={className}
                sessionId={sessionId}
                startTime={startTime}
                onClose={() => setIsNotesOpen(false)}
                side={notesSide}
                onToggleSide={() => setNotesSide(prev => prev === 'left' ? 'right' : 'left')}
                initialContent={notesContent}
                onContentChange={setNotesContent}
                isMobile={isMobile}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}