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
import { resetFinalTranscription } from '@/features/transcription/services/transcription.service';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type Position = 'top' | 'bottom' | 'left' | 'right' | 'free';
export type Command = Position | 'free' | null;

interface TranscriptionPanelProps {
  command: Command;
  onPositionChange: (position: Position) => void;
  sessionId: string;
}

export function TranscriptionPanel({ command, onPositionChange, sessionId }: TranscriptionPanelProps) {
  const { transcription, setTranscription } = useTranscription();
  const { style, isBionic, showRuler } = useStyle();
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

  const renderContent = () => (
    <ScrollArea className="h-full">
      <div
        ref={transcriptionDisplayRef}
        className="p-6 break-words bg-background relative"
        style={{ ...style, minHeight: '100%', color: 'var(--foreground)' }}
        onMouseMove={showRuler ? handleContentMouseMove : undefined}
      >
        {isBionic ? <BionicReadingText text={transcription} /> : transcription}
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
    </ScrollArea>
  );

  // Autoscroll cada vez que cambie la transcripción
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [transcription]);

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
      {/* esquina redimensionable */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30"
        onMouseDown={handleResizeMouseDown}
      />
      <Card className="h-full w-full flex flex-col shadow-2xl" onDoubleClick={() => isDocked && handleSetPosition('free')}>
        <CardHeader
          className={`flex flex-row items-center justify-between p-3 border-b ${isDocked ? '' : 'cursor-move drag-handle'}`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="text-muted-foreground" />
            <CardTitle className="text-base font-semibold truncate">Transcripción</CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <SettingsButton />

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
                <TooltipContent>Ajustar panel</TooltipContent>
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

        <CardContent className="p-0 flex-grow overflow-hidden min-h-0">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
