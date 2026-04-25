'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowBigUp,
  ArrowBigDown,
  ArrowBigLeft,
  ArrowBigRight,
  GripVertical,
  Maximize,
  PictureInPicture2,
  Copy,
  FileDown,
  FileText,
  Download,
  Layout,
  Maximize2,
  ChevronDown,
  Eraser,
  ArrowLeftRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createPortal } from 'react-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranscription } from '@/features/transcription/hooks/use-transcription';
import { useStyle } from '@/context/StyleContext';
import { SettingsButton } from '@/components/settings/SettingsButton';
import { BionicReadingText } from '@/components/BionicReadingText';
import { resetFinalTranscription, updateTranscriptionSegment } from '@/features/transcription/services/transcription.service';
import { EditableParagraph } from '@/features/transcription/components/EditableParagraph';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type Position = 'top' | 'bottom' | 'left' | 'right' | 'free';
export type Command = Position | 'free' | null;

interface TranscriptionPanelProps {
  command: Command;
  onPositionChange: (position: Position) => void;
  sessionId: string;
  hideHighlighting?: boolean;
  showResizeIcon?: boolean;
  isStatic?: boolean;
  onToggleSide?: () => void;
}

export type HighlightColor = 'amarillo' | 'verde' | 'rojo' | 'azul' | 'naranja' | 'morado' | 'rosa' | 'teal' | 'gris';

interface Highlight {
  text: string;
  color: HighlightColor;
}

export function TranscriptionPanel({ 
  command, 
  onPositionChange, 
  sessionId,
  hideHighlighting = false,
  showResizeIcon = false,
  isStatic = false,
  onToggleSide
}: TranscriptionPanelProps) {
  const { transcription, setTranscription } = useTranscription();
  const { style, isBionic, showRuler, theme } = useStyle();
  const { toast } = useToast();
  const [rulerY, setRulerY] = useState<number>(0);
  const transcriptionDisplayRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<Date>(new Date());

  // Estados para arrastrar y redimensionar
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleContentMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!transcriptionDisplayRef.current) return;
    const rect = transcriptionDisplayRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setRulerY(y);
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
    e.preventDefault();
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;
    setSize({
      width: Math.max(380, resizeStartRef.current.width + dx),
      height: Math.max(150, resizeStartRef.current.height + dy),
    });
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing]);

  const [currentPosition, setCurrentPosition] = useState<Position>('free');
  const [size, setSize] = useState({ width: 500, height: 300 });
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Marcatextos / Highlights
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [recentColors, setRecentColors] = useState<HighlightColor[]>(['amarillo', 'verde', 'rojo']);
  const ALL_COLORS: HighlightColor[] = ['amarillo', 'verde', 'rojo', 'azul', 'naranja', 'morado', 'rosa', 'teal', 'gris'];

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

  const handleApplyHighlight = (color: HighlightColor) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();

    if (text.length > 0) {
      setHighlights(prev => {
        if (prev.some(h => h.text === text && h.color === color)) return prev;
        return [...prev, { text, color }];
      });
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
      setHighlights(prev => prev.filter(h => {
        const hText = h.text.toLowerCase();
        return !text.includes(hText) && !hText.includes(text);
      }));
    }
    selection.removeAllRanges();
  };

  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 }); // Posición del ratón relativa al panel

  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close();
      return;
    }

    if (!('documentPictureInPicture' in window)) {
      alert('Tu navegador no soporta la función flotante Document PiP (requiere Chrome/Edge en PC).');
      return;
    }

    try {
      const pip = await (window as any).documentPictureInPicture.requestWindow({
        width: 450,
        height: 350,
      });

      // Copiar hojas de estilo
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pip.document.head.appendChild(style);
        } catch (e) {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pip.document.head.appendChild(link);
          }
        }
      });

      pip.document.documentElement.className = document.documentElement.className;
      pip.document.body.className = "bg-background text-foreground";

      setPipWindow(pip);

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });
    } catch (error) {
      console.error('Error al abrir PiP:', error);
    }
  };

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleSetPosition = useCallback((newPosition: Position) => {
    setCurrentPosition(newPosition);
    onPositionChange(newPosition);
    if (!panelRef.current?.parentElement) return;

    const parentW = panelRef.current.parentElement.offsetWidth;
    const parentH = panelRef.current.parentElement.offsetHeight;

    switch (newPosition) {
      case 'top':
        setSize({ width: parentW, height: parentH * 0.3 });
        setPos({ x: 0, y: 0 });
        break;
      case 'bottom':
        setSize({ width: parentW, height: parentH * 0.4 });
        setPos({ x: 0, y: parentH * 0.6 });
        break;
      case 'left':
        setSize({ width: parentW * 0.3, height: parentH });
        setPos({ x: 0, y: 0 });
        break;
      case 'right':
        setSize({ width: parentW * 0.3, height: parentH });
        setPos({ x: parentW * 0.7, y: 0 });
        break;
      case 'free':
        if (isMobile) {
          setCurrentPosition('bottom');
          onPositionChange('bottom');
          setSize({ width: parentW, height: parentH * 0.4 });
          setPos({ x: 0, y: parentH * 0.6 });
        } else {
          setSize({ width: 500, height: 300 });
          setPos({ x: parentW / 2 - 250, y: parentH / 2 - 150 });
        }
        break;
    }
  }, [isMobile, onPositionChange]);

  // Centrar o anclar en móvil al inicio
  useEffect(() => {
    // Pequeño delay para asegurar que el padre tenga dimensiones
    const timer = setTimeout(() => {
      handleSetPosition(isMobile ? 'bottom' : 'free');
    }, 100);
    return () => clearTimeout(timer);
  }, [isMobile, handleSetPosition]);

  // Ejecutar comando de voz
  useEffect(() => {
    if (command) handleSetPosition(command);
  }, [command, handleSetPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (currentPosition !== 'free') return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    e.preventDefault();
  }, [pos, currentPosition]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !panelRef.current?.parentElement) return;

    const parentBounds = panelRef.current.parentElement.getBoundingClientRect();
    let newX = e.clientX - dragStartRef.current.x;
    let newY = e.clientY - dragStartRef.current.y;

    // Limitar al viewport
    newX = Math.max(0, Math.min(newX, parentBounds.width - size.width));
    newY = Math.max(0, Math.min(newY, parentBounds.height - size.height));

    setPos({ x: newX, y: newY });
  }, [isDragging, size.width, size.height]);


  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  const isDocked = currentPosition !== 'free';

  // --- Funciones de Exportación ---
  const buildTextHeader = (endTime: Date): string => {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════');
    lines.push('  TRANSCRIPCIÓN DE LA CLASE (MAESTRO)');
    lines.push('═══════════════════════════════════════════');
    lines.push(`  Sala: ${sessionId}`);
    lines.push(`  Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    lines.push(`  Hora de inicio: ${startTimeRef.current.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
    lines.push(`  Hora de finalización: ${endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
    lines.push('═══════════════════════════════════════════');
    lines.push('');
    return lines.join('\n');
  };

  const handleCopy = () => {
    const endTime = new Date();
    const content = buildTextHeader(endTime) + transcription;
    navigator.clipboard.writeText(content);
    toast({ title: 'Copiado', description: 'Transcripción copiada al portapapeles.' });
  };

  const handleSaveTxt = () => {
    const endTime = new Date();
    const content = buildTextHeader(endTime) + transcription;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcripcion-maestro-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportToPdf = async () => {
    if (!transcriptionDisplayRef.current) return;
    const endTime = new Date();
    toast({ title: 'Generando PDF...', description: 'Espera un momento.' });

    const canvas = await html2canvas(transcriptionDisplayRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Transcripción de la Clase', margin, margin);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let metaY = margin + 8;
    pdf.text(`Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, metaY);
    metaY += 4;
    pdf.text(`Sala: ${sessionId}`, margin, metaY);
    metaY += 4;
    pdf.text(`Hora de inicio: ${startTimeRef.current.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, margin, metaY);
    metaY += 4;
    pdf.text(`Hora de finalización: ${endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, margin, metaY);
    metaY += 4;

    pdf.setLineWidth(0.5);
    pdf.line(margin, metaY + 1, pageWidth - margin, metaY + 1);

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', margin, metaY + 5, imgWidth, imgHeight);

    pdf.save(`transcripcion-maestro-${sessionId}.pdf`);
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que deseas borrar toda la transcripción actual?')) {
      resetFinalTranscription();
      setTranscription('');
      startTimeRef.current = new Date();
    }
  };

  // Referencia para autoscroll
  const bottomRef = useRef<HTMLDivElement>(null);

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

    const matchers: { text: string; type: HighlightColor }[] = [];

    [...highlights]
      .sort((a, b) => b.text.length - a.text.length)
      .forEach(h => {
        if (h.text.trim()) matchers.push({ text: h.text.toLowerCase(), type: h.color });
      });

    if (matchers.length === 0 || hideHighlighting) return isBionic ? <BionicReadingText text={textToRender} /> : textToRender;

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = matchers.map(m => escapeRegExp(m.text)).join('|');
    const parts = textToRender.split(new RegExp(`(${regexPattern})`, 'gi'));

    return (
      <>
        {parts.map((part, index) => {
          const lowerPart = part.toLowerCase();
          const matchedTheme = matchers.find(m => m.text === lowerPart);

          if (matchedTheme) {
            let cls = 'px-1 rounded transition-colors';
            const colorMapping: Record<string, string> = {
              amarillo: 'yellow', verde: 'green', rojo: 'red',
              azul: 'blue', naranja: 'orange', morado: 'purple',
              rosa: 'pink', teal: 'teal', gris: 'gray'
            };
            const colorName = colorMapping[matchedTheme.type as string] || 'yellow';
            let styleObj: React.CSSProperties = {
              backgroundColor: `var(--highlight-${colorName})`,
              color: 'var(--foreground)'
            };

            return (
              <mark key={index} className={cls} style={styleObj}>
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

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Permitir un margen de error de 50px para considerarlo al fondo
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScrollEnabled(isAtBottom);
  };

  const renderContent = () => (
    <div className="h-full overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
      <div
        ref={transcriptionDisplayRef}
        className="p-6 break-words bg-background relative"
        style={{ ...style, minHeight: '100%', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}
        onMouseMove={showRuler ? handleContentMouseMove : undefined}
      >
        {transcription.split('\n\n').map((paragraph, index, arr) => (
          <React.Fragment key={index}>
            <EditableParagraph 
              text={paragraph} 
              onSave={(oldText, newText) => updateTranscriptionSegment(oldText, newText)}
            >
              {renderHighlightedText(paragraph)}
            </EditableParagraph>
            {index < arr.length - 1 && '\n\n'}
          </React.Fragment>
        ))}
        <div ref={bottomRef} />
        {showRuler && (
          <div
            className="absolute left-0 right-0 bg-primary/20 pointer-events-none z-10 border-y border-primary/30"
            style={{
              top: rulerY - (style.fontSize * style.lineHeight) / 2,
              height: style.fontSize * style.lineHeight,
            }}
          />
        )}
      </div>
    </div>
  );

  // Autoscroll cada vez que cambie la transcripción
  useEffect(() => {
    if (isAutoScrollEnabled && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [transcription, isAutoScrollEnabled]);

  // Vista para Móvil
  if (isMobile) {
    return (
      <div className="w-full h-full px-4 pt-20 pb-4 flex flex-col pointer-events-auto">
        <Card className="w-full flex-1 flex flex-col shadow-2xl border-2 min-h-0">
          <CardHeader className="flex flex-row items-center justify-between p-3 border-b shrink-0 h-14">
            <CardTitle className="text-base font-semibold">Transcripción</CardTitle>
            <div className="flex items-center gap-1">
              <SettingsButton />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" /> Copiar al portapapeles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSaveTxt}>
                    <FileDown className="h-4 w-4 mr-2" /> Guardar como .txt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportToPdf}>
                    <FileText className="h-4 w-4 mr-2" /> Exportar a PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-hidden min-h-0 bg-background">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pipWindow) {
    const originalPanel = (
      <div
        ref={panelRef}
        className={`absolute pointer-events-auto z-20 ${isDragging ? 'select-none' : ''}`}
        style={{
          left: pos.x,
          top: pos.y,
          width: size.width,
          height: size.height,
          transition: isDragging ? 'none' : 'all 0.2s ease-out',
        }}
      >
        <Card className="h-full w-full flex flex-col shadow-2xl items-center justify-center p-6 text-center border-dashed border-2 border-muted">
          <PictureInPicture2 className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Pantalla Flotante Activa</h3>
          <p className="text-muted-foreground text-sm mb-6">
            La transcripción está ahora en una ventana que siempre se mantiene encima. Ideal para usar PowerPoint o Canva al mismo tiempo.
          </p>
          <Button onClick={() => pipWindow.close()} variant="outline">
            Regresar transcripción aquí
          </Button>
        </Card>
      </div>
    );

    const pipContent = createPortal(
      <div className="h-[100vh] w-[100vw] bg-background flex flex-col overflow-hidden text-foreground">
        <div className="p-2 border-b bg-muted/30 flex justify-between items-center shadow-sm select-none">
          <div className="flex items-center gap-2">
            <PictureInPicture2 className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">TranscribeAssist (Siempre encima)</span>
          </div>
          <SettingsButton />
        </div>
        <div className="flex-grow p-0 min-h-0 bg-background overflow-hidden relative">
          {renderContent()}
        </div>
      </div>,
      pipWindow.document.body
    );

    return (
      <>
        {originalPanel}
        {pipContent}
      </>
    );
  }

  // Panel Base (el Card solo)
  const panelCard = (
    <Card className="h-full w-full flex flex-col shadow-2xl relative" onDoubleClick={() => !isStatic && isDocked && handleSetPosition('free')}>
      {/* esquina redimensionable logic */}
      {showResizeIcon && (
        <div
          className={cn(
            "absolute bottom-0 right-0 w-6 h-6 z-30 flex items-center justify-center group cursor-nwse-resize"
          )}
          onMouseDown={handleResizeMouseDown}
        >
          <Maximize2 className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors rotate-90" />
        </div>
      )}

      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between p-3 border-b shrink-0 h-14 bg-muted/20",
          !isStatic && (isDocked ? '' : 'cursor-move drag-handle')
        )}
        onMouseDown={!isStatic ? handleMouseDown : undefined}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CardTitle className="text-base font-semibold truncate">Transcripción</CardTitle>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <SettingsButton />

          {!isStatic && (
            <>
              {/* Menú de Posición y Anclaje */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Layout className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Posición del panel</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSetPosition('top')}>
                    <ArrowBigUp className="h-4 w-4 mr-2" /> Anclar arriba
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetPosition('bottom')}>
                    <ArrowBigDown className="h-4 w-4 mr-2" /> Anclar abajo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetPosition('left')}>
                    <ArrowBigLeft className="h-4 w-4 mr-2" /> Anclar izquierda
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetPosition('right')}>
                    <ArrowBigRight className="h-4 w-4 mr-2" /> Anclar derecha
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetPosition('free')}>
                    <Maximize2 className="h-4 w-4 mr-2" /> Modo flotante / Libre
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={togglePiP}>
                    <PictureInPicture2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent><p>Pantalla Flotante (PiP)</p></TooltipContent>
              </Tooltip>
            </>
          )}

          {isStatic && onToggleSide && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleSide}>
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cambiar de lado</TooltipContent>
            </Tooltip>
          )}

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Exportar transcripción</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" /> Copiar al portapapeles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSaveTxt}>
                <FileDown className="h-4 w-4 mr-2" /> Guardar como .txt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportToPdf}>
                <FileText className="h-4 w-4 mr-2" /> Exportar a PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {isStatic && (
        <div className="p-1 sm:p-2 border-b bg-muted/30 h-11 flex items-center shrink-0 overflow-x-auto no-scrollbar">
          {!hideHighlighting && (
            <div className="flex items-center gap-0.5 ml-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handleRemoveHighlight}
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Quitar resaltado</TooltipContent>
              </Tooltip>

              <div className="w-px h-5 bg-border mx-1" />

              {recentColors.map(color => {
                const colorInfo = getThemeHighlightColor(color);
                return (
                  <Tooltip key={`ttoolbar-${color}`}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted" onClick={() => handleApplyHighlight(color)}>
                        <div className={`h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm ${colorInfo.bg}`}></div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="capitalize">{colorInfo.label}</TooltipContent>
                  </Tooltip>
                );
              })}

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 ml-0.5">
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Más colores</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-48 p-2">
                    <div className="grid grid-cols-3 gap-2">
                        {ALL_COLORS.map(color => {
                            const colorInfo = getThemeHighlightColor(color);
                            return (
                                <Tooltip key={`ttoolbar-drop-${color}`}>
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
          )}
        </div>
      )}

      <CardContent className="p-0 flex-grow overflow-hidden min-h-0">
        {renderContent()}
      </CardContent>
    </Card>
  );

  if (isStatic) return panelCard;

  // Vista para Escritorio
  return (
    <div
      ref={panelRef}
      className={`absolute pointer-events-auto z-20 ${isDragging ? 'select-none' : ''}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        transition: isDragging ? 'none' : 'all 0.2s ease-out',
      }}
    >
      {panelCard}
    </div>
  );
}
