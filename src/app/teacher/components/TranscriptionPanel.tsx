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
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranscription } from '@/hooks/use-transcription';
import { useStyle } from '@/context/StyleContext';
import { SettingsButton } from '@/components/settings/SettingsButton';
import { BionicReadingText } from '@/components/BionicReadingText';

type Position = 'top' | 'bottom' | 'left' | 'right' | 'free';
export type Command = Position | 'free' | null;

export function TranscriptionPanel({ command }: { command: Command }) {
  const { transcription } = useTranscription();
  const { style, isBionic } = useStyle();

  const [currentPosition, setCurrentPosition] = useState<Position>('free');
  const [size, setSize] = useState({ width: 500, height: 300 });
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 }); // Posición del ratón relativa al panel

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Centrar o anclar en móvil
  useEffect(() => {
    if (isMobile) {
      handleSetPosition('bottom');
    } else {
      setPos({
        x: window.innerWidth / 2 - 250,
        y: window.innerHeight / 2 - 150,
      });
      setSize({ width: 500, height: 300 });
      setCurrentPosition('free');
    }
  }, [isMobile]);

  // Ejecutar comando de voz
  useEffect(() => {
    if (command) handleSetPosition(command);
  }, [command]);

  const handleSetPosition = (newPosition: Position | 'free') => {
    setCurrentPosition(newPosition);
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
        if (isMobile) return handleSetPosition('bottom');
        setSize({ width: 500, height: 300 });
        setPos({ x: parentW / 2 - 250, y: parentH / 2 - 150 });
        break;
    }
  };

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

  const renderContent = () => (
    <ScrollArea className="h-full">
      <div
        className="p-4 break-words bg-transparent"
        style={{ ...style, height: '100%', color: 'inherit' }}
      >
        {isBionic ? <BionicReadingText text={transcription} /> : transcription}
      </div>
    </ScrollArea>
  );

  // Vista para Móvil
  if (isMobile) {
    return (
      <Card className="fixed bottom-0 left-0 right-0 h-[40vh] w-full flex flex-col shadow-2xl rounded-b-none border-t z-20">
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
          <CardTitle className="text-base font-semibold">Transcripción</CardTitle>
          <SettingsButton />
        </CardHeader>
        <CardContent className="p-0 flex-grow">{renderContent()}</CardContent>
      </Card>
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
      <Card className="h-full w-full flex flex-col shadow-2xl" onDoubleClick={() => isDocked && handleSetPosition('free')}>
        <CardHeader
          className={`flex flex-row items-center justify-between p-3 border-b ${isDocked ? '' : 'cursor-move drag-handle'}`}
          onMouseDown={handleMouseDown}
        >
            <div className="flex items-center gap-2">
              <GripVertical className="text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Transcripción</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <SettingsButton />
              {/* Botones de anclaje... */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetPosition('top')}>
                    <ArrowBigUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent><p>Anclar arriba</p></TooltipContent>
              </Tooltip>
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetPosition('bottom')}>
                    <ArrowBigDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent><p>Anclar abajo</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetPosition('left')}>
                    <ArrowBigLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent><p>Anclar izquierda</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetPosition('right')}>
                    <ArrowBigRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent><p>Anclar derecha</p></TooltipContent>
              </Tooltip>
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetPosition('free')}>
                    <Maximize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent><p>Modo flotante</p></TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            {renderContent()}
          </CardContent>
      </Card>
    </div>
  );
}
