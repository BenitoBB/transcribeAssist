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
  Image as ImageIcon,
  ChevronDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export type HighlightColor = 'amarillo' | 'verde' | 'rojo' | 'azul' | 'naranja' | 'morado' | 'rosa' | 'teal' | 'gris';

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
import { useTranscription } from '@/features/transcription/hooks/use-transcription';
import { joinSession, onDataReceived, onConnectionStatusChange, ConnectionStatus } from '@/features/room/services/p2p.service';
import { BionicReadingText } from '@/components/BionicReadingText';
import { NotesPanel } from '@/features/notes/components/NotesPanel';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
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
  const bottomRef = useRef<HTMLDivElement>(null);

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
  const [captures, setCaptures] = useState<{ url: string; timestamp: string }[]>([]);

  // Redimensionamiento horizontal
  const [notesWidth, setNotesWidth] = useState(384); // 384px es el w-96 original
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidth;
      
      if (notesSide === 'right') {
        newWidth = containerRect.right - e.clientX;
      } else {
        newWidth = e.clientX - containerRect.left;
      }

      // Limitar ancho (mínimo 250px, máximo 60% del contenedor)
      const minWidth = 250;
      const maxWidth = containerRect.width * 0.6;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setNotesWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  // Function to resolve highlight colors based on theme
  const getThemeHighlightColor = (baseColor: HighlightColor): { bg: string; text: string; label: string; hex: string } => {
    if (theme === 'protanopia' || theme === 'deuteranopia') {
      if (baseColor === 'amarillo') return { bg: 'bg-blue-200', text: 'text-blue-900', label: 'Amarillo (Azul)', hex: '#bfdbfe' };
      if (baseColor === 'verde') return { bg: 'bg-orange-200', text: 'text-orange-900', label: 'Verde (Naranja)', hex: '#fed7aa' };
      if (baseColor === 'rojo') return { bg: 'bg-purple-200', text: 'text-purple-900', label: 'Rojo (Morado)', hex: '#e9d5ff' };
      if (baseColor === 'azul') return { bg: 'bg-cyan-200', text: 'text-cyan-900', label: 'Azul', hex: '#a5f3fc' };
      if (baseColor === 'naranja') return { bg: 'bg-emerald-200', text: 'text-emerald-900', label: 'Naranja (VerdeE)', hex: '#a7f3d0' };
      if (baseColor === 'morado') return { bg: 'bg-red-200', text: 'text-red-900', label: 'Morado (Rojo)', hex: '#fecaca' };
      if (baseColor === 'rosa') return { bg: 'bg-lime-200', text: 'text-lime-900', label: 'Rosa (Lima)', hex: '#d9f99d' };
      if (baseColor === 'teal') return { bg: 'bg-orange-200', text: 'text-orange-900', label: 'Teal (Naranja)', hex: '#fed7aa' };
      if (baseColor === 'gris') return { bg: 'bg-gray-200', text: 'text-gray-900', label: 'Gris', hex: '#e5e7eb' };
    }
    if (theme === 'dark') {
      if (baseColor === 'amarillo') return { bg: 'bg-yellow-500/40', text: 'text-yellow-100', label: 'Amarillo', hex: '#ca8a04' };
      if (baseColor === 'verde') return { bg: 'bg-green-500/40', text: 'text-green-100', label: 'Verde', hex: '#16a34a' };
      if (baseColor === 'rojo') return { bg: 'bg-red-500/40', text: 'text-red-100', label: 'Rojo', hex: '#dc2626' };
      if (baseColor === 'azul') return { bg: 'bg-blue-500/40', text: 'text-blue-100', label: 'Azul', hex: '#2563eb' };
      if (baseColor === 'naranja') return { bg: 'bg-orange-500/40', text: 'text-orange-100', label: 'Naranja', hex: '#ea580c' };
      if (baseColor === 'morado') return { bg: 'bg-purple-500/40', text: 'text-purple-100', label: 'Morado', hex: '#9333ea' };
      if (baseColor === 'rosa') return { bg: 'bg-pink-500/40', text: 'text-pink-100', label: 'Rosa', hex: '#db2777' };
      if (baseColor === 'teal') return { bg: 'bg-teal-500/40', text: 'text-teal-100', label: 'Teal', hex: '#0d9488' };
      if (baseColor === 'gris') return { bg: 'bg-gray-500/40', text: 'text-gray-100', label: 'Gris', hex: '#4b5563' };
    }
    if (baseColor === 'amarillo') return { bg: 'bg-yellow-200', text: 'text-yellow-900', label: 'Amarillo', hex: '#fef08a' };
    if (baseColor === 'verde') return { bg: 'bg-green-200', text: 'text-green-900', label: 'Verde', hex: '#bbf7d0' };
    if (baseColor === 'rojo') return { bg: 'bg-red-200', text: 'text-red-900', label: 'Rojo', hex: '#fecaca' };
    if (baseColor === 'azul') return { bg: 'bg-blue-200', text: 'text-blue-900', label: 'Azul', hex: '#bfdbfe' };
    if (baseColor === 'naranja') return { bg: 'bg-orange-200', text: 'text-orange-900', label: 'Naranja', hex: '#fed7aa' };
    if (baseColor === 'morado') return { bg: 'bg-purple-200', text: 'text-purple-900', label: 'Morado', hex: '#e9d5ff' };
    if (baseColor === 'rosa') return { bg: 'bg-pink-200', text: 'text-pink-900', label: 'Rosa', hex: '#fbcfe8' };
    if (baseColor === 'teal') return { bg: 'bg-teal-200', text: 'text-teal-900', label: 'Teal', hex: '#99f6e4' };
    if (baseColor === 'gris') return { bg: 'bg-gray-200', text: 'text-gray-900', label: 'Gris', hex: '#e5e7eb' };

    return { bg: 'bg-yellow-200', text: 'text-yellow-900', label: 'Marcado', hex: '#fef08a' };
  };

  const [recentColors, setRecentColors] = useState<HighlightColor[]>(['amarillo', 'verde', 'rojo']);
  const ALL_COLORS: HighlightColor[] = ['amarillo', 'verde', 'rojo', 'azul', 'naranja', 'morado', 'rosa', 'teal', 'gris'];

  const handleApplyHighlight = (color: HighlightColor) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (text.length > 0) {
      setHighlights(prev => {
        if (prev.some(h => h.text === text && h.color === color)) return prev;
        return [...prev, { text, color }];
      });
      
      // Actualizar historial
      setRecentColors(prev => {
          const newHistory = [color, ...prev.filter(c => c !== color)];
          return newHistory.slice(0, 3);
      });
    }
    selection.removeAllRanges();
  };

  const handleRemoveHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim().toLowerCase();

    if (text.length > 0) {
      // Filtramos cualquier marcador que esté contenido en la selección o que contenga la selección
      setHighlights(prev => prev.filter(h => {
        const hText = h.text.toLowerCase();
        // Si el texto del marcador está en la selección, lo quitamos
        return !text.includes(hText) && !hText.includes(text);
      }));
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
      if (data.type === 'whiteboard_capture' && data.dataUrl) {
        setCaptures(prev => [{ url: data.dataUrl, timestamp: data.timestamp || new Date().toISOString() }, ...prev]);
        toast({ title: 'Nueva captura', description: 'El maestro ha compartido una imagen de la pizarra.' });
      }
    });

    const unsubStatus = onConnectionStatusChange(status => {
      setConnectionStatus(status);
      if (status === 'connected') {
        if (!hasConnected.current) {
          hasConnected.current = true;
          setTranscription('');
        }
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
            let styleObj: React.CSSProperties = {};
            let id = undefined;

            if (matchedTheme.type === 'search') {
              cls = 'bg-yellow-300 text-black px-1 rounded shadow-sm';
              if (searchHitCount === 0) id = 'first-search-match';
              searchHitCount++;
            } else {
              // Usamos variables CSS para que sea reactivo al tema
              cls = 'px-1 rounded transition-colors';
              
              const colorMapping: Record<string, string> = {
                amarillo: 'yellow',
                verde: 'green',
                rojo: 'red',
                azul: 'blue',
                naranja: 'orange',
                morado: 'purple',
                rosa: 'pink',
                teal: 'teal',
                gris: 'gray'
              };
              
              const colorName = colorMapping[matchedTheme.type as string] || 'yellow';
              styleObj = {
                backgroundColor: `var(--highlight-${colorName})`,
                color: 'var(--foreground)'
              };
            }

            return (
              <mark key={index} className={cls} id={id} style={styleObj}>
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

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScrollEnabled(isAtBottom);
  };

  useEffect(() => {
    if (isAutoScrollEnabled && bottomRef.current && !searchQuery.trim()) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [transcription, isAutoScrollEnabled, searchQuery]);

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

        <Dialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <ImageIcon className="h-4 w-4" />
                  {captures.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">
                      {captures.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent><p>Ver capturas de pizarra</p></TooltipContent>
          </Tooltip>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Capturas de Pizarra</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-2">
              {captures.length === 0 ? (
                <p className="text-muted-foreground">No hay capturas aún.</p>
              ) : (
                captures.map((c, i) => (
                  <div key={i} className="flex flex-col gap-2 border rounded-lg p-2 bg-muted/20">
                    <img src={c.url} alt="Captura" className="w-full rounded border bg-white object-contain" />
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs text-muted-foreground">{new Date(c.timestamp).toLocaleTimeString()}</span>
                      <Button size="sm" variant="outline" asChild>
                        <a href={c.url} download={`captura-${new Date(c.timestamp).getTime()}.png`}>Guardar</a>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
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
              placeholder="ID de la Sala (5 caracteres)"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value.toLowerCase().slice(0, 5))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
              maxLength={5}
              className="text-center"
            />
            <Button onClick={handleConnect} disabled={connectionStatus === 'connecting'}>
              {connectionStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mt-12 mb-4 sm:mt-0 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Vista del Alumno</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Sala: <span className="font-mono text-primary">{sessionId}</span>
            </p>
          </div>

          <div className="w-full max-w-7xl mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
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

          <div 
            ref={containerRef}
            className={cn(
              "flex w-full items-stretch justify-center transition-all duration-300 min-h-0",
              isMobile ? "max-w-full flex-col h-[75vh]" : "max-w-7xl h-[60vh] gap-0",
              isNotesOpen && notesSide === 'left' && !isMobile ? 'flex-row-reverse' : !isMobile ? 'flex-row' : ''
            )}
          >
            <Card className={cn(
              "min-w-0 flex flex-col shadow-lg border-2",
              isMobile && isNotesOpen ? "h-[45%] shrink-0" : "flex-1 h-full"
            )}>
              <CardHeader className="p-3 border-b flex flex-row items-center justify-between gap-1 overflow-hidden shrink-0 h-14">
                <CardTitle className="text-sm font-bold truncate">Transcripción</CardTitle>
              </CardHeader>

              <div className="p-1 sm:p-2 border-b bg-muted/30 flex items-center justify-between gap-0.5 sm:gap-1 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-0 sm:gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
                        onClick={handleRemoveHighlight}
                      >
                        <Eraser className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Quitar resaltado</TooltipContent>
                  </Tooltip>

                  <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1" />

                  {/* Marcatextos - Historial de 3 Colores */}
                  {recentColors.map(color => (
                    <Tooltip key={`highlight-${color}`}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-muted" onClick={() => handleApplyHighlight(color)}>
                          <div className={`h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border border-black/10 shadow-sm ${getThemeHighlightColor(color).bg}`}></div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="capitalize">{getThemeHighlightColor(color).label}</TooltipContent>
                    </Tooltip>
                  ))}

                  {/* Menú de 9 colores */}
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 ml-1">
                            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Más colores de resaltado</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="start" className="w-48 p-2">
                        <div className="grid grid-cols-3 gap-2">
                            {ALL_COLORS.map(color => {
                                const colorInfo = getThemeHighlightColor(color);
                                return (
                                    <Tooltip key={`drop-alumn-${color}`}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-10 w-full flex justify-center items-center p-0 rounded-md hover:bg-muted"
                                                onClick={() => handleApplyHighlight(color)}
                                            >
                                                <div className={`h-5 w-5 rounded-full border border-black/10 shadow-sm ${colorInfo.bg}`} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="capitalize">{colorInfo.label}</TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-0 sm:gap-0.5 ml-auto">
                  {isSearching ? (
                    <Input
                      ref={searchInputRef}
                      type="search"
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-7 sm:h-8 text-xs sm:text-sm w-24 sm:w-32"
                      autoFocus
                      onBlur={() => !searchQuery && setIsSearching(false)}
                    />
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setIsSearching(true)}>
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Buscar en el texto</TooltipContent>
                    </Tooltip>
                  )}

                  <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar texto</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleSave}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>TXT</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleExportToPdf}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>PDF</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <CardContent className="p-0 flex-grow overflow-hidden bg-background rounded-b-xl">
                <div className="h-full w-full overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
                  <div
                    ref={transcriptionDisplayRef}
                    className="p-6 break-words relative"
                    onMouseMove={showRuler ? handleContentMouseMove : undefined}
                    style={{ ...style, minHeight: '100%', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}
                  >
                    {renderHighlightedText(transcription)}
                    <div ref={bottomRef} />
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
                </div>
              </CardContent>
            </Card>

            {isNotesOpen && !isMobile && (
              <div
                onMouseDown={startResizing}
                className={cn(
                  "w-2 hover:bg-primary/20 cursor-col-resize flex items-center justify-center transition-colors group z-10",
                  isResizing ? "bg-primary/30" : ""
                )}
              >
                <div className="w-1 h-12 bg-border rounded-full group-hover:bg-primary/40 transition-colors" />
              </div>
            )}

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
                customWidth={!isMobile ? notesWidth : undefined}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}