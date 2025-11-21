
'use client';

import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { Rnd } from 'react-rnd';
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
import { WordWrapper } from '@/components/WordWrapper';

type Position = 'top' | 'bottom' | 'left' | 'right' | 'free';

export function TranscriptionPanel() {
  const { transcription } = useTranscription();
  const { style } = useStyle();

  const [position, setPosition] = useState<Position>('free');
  const [size, setSize] = useState({ width: 500, height: 300 });
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [isMobile, setIsMobile] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (parentRef.current) {
      const parentW = parentRef.current.offsetWidth;
      const parentH = parentRef.current.offsetHeight;
      if (isMobile) {
        handleSetPosition('bottom');
      } else {
        setPos({
          x: (parentW - 500) / 2,
          y: (parentH - 300) / 2,
        });
        setSize({ width: 500, height: 300 });
        setPosition('free');
      }
    }
  }, [isMobile]);

  const handleSetPosition = (newPosition: Position) => {
    setPosition(newPosition);
    if (!parentRef.current) return;
    const { offsetWidth: parentW, offsetHeight: parentH } = parentRef.current;

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
          handleSetPosition('bottom');
          return;
        }
        setSize({ width: 500, height: 300 });
        setPos({ x: (parentW - 500) / 2, y: (parentH - 300) / 2 });
        break;
    }
  };
  
  const isDocked = position !== 'free';

  const renderContent = () => (
    <ScrollArea className="h-full">
      <div
        className="p-4 prose bg-transparent"
        style={{
          fontSize: `${style.fontSize}px`,
          lineHeight: style.lineHeight,
          letterSpacing: `${style.letterSpacing}px`,
          fontFamily: style.fontFamily,
          height: '100%',
          color: 'inherit',
        }}
      >
        <WordWrapper text={transcription} />
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Card className="fixed bottom-0 left-0 right-0 h-[40vh] w-full flex flex-col shadow-2xl rounded-b-none border-t">
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
          <CardTitle className="text-base font-semibold">Transcripción</CardTitle>
          <SettingsButton />
        </CardHeader>
        <CardContent className="p-0 flex-grow">{renderContent()}</CardContent>
      </Card>
    );
  }

  return (
    <div ref={parentRef} className="w-full h-full absolute top-0 left-0 pointer-events-none">
      <Rnd
        size={size}
        position={pos}
        onDragStop={(e, d) => {
          if (isDocked) return;
          setPos({ x: d.x, y: d.y });
          setPosition('free');
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          if (isDocked) return;
          setSize({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          });
          setPos(position);
          setPosition('free');
        }}
        bounds="parent"
        dragHandleClassName="drag-handle"
        className="pointer-events-auto"
        enableResizing={!isDocked}
        disableDragging={isDocked}
      >
        <Card className="h-full w-full flex flex-col shadow-2xl" onDoubleClick={() => isDocked && handleSetPosition('free')}>
          <CardHeader className="flex flex-row items-center justify-between p-3 border-b drag-handle cursor-move">
            <div className="flex items-center gap-2">
              <GripVertical className="text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Transcripción</CardTitle>
            </div>
            <div className="flex items-center gap-1">
               <SettingsButton />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSetPosition('top')}
                    aria-label="Anclar arriba"
                  >
                    <ArrowBigUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Anclar arriba</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSetPosition('bottom')}
                    aria-label="Anclar abajo"
                  >
                    <ArrowBigDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Anclar abajo</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSetPosition('left')}
                    aria-label="Anclar izquierda"
                  >
                    <ArrowBigLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Anclar a la izquierda</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSetPosition('right')}
                    aria-label="Anclar derecha"
                  >
                    <ArrowBigRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Anclar a la derecha</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSetPosition('free')}
                    aria-label="Posición inicial"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modo flotante</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            {renderContent()}
          </CardContent>
        </Card>
      </Rnd>
    </div>
  );
}
