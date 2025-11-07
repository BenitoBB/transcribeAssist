'use client';

import { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowBigUp,
  ArrowBigDown,
  ArrowBigLeft,
  ArrowBigRight,
  GripVertical,
  Maximize,
} from 'lucide-react';

type Position = 'top' | 'bottom' | 'left' | 'right' | 'free';

export function TranscriptionPanel() {
  const [position, setPosition] = useState<Position>('free');
  const [size, setSize] = useState({ width: 500, height: 300 });
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const parentRef = useRef<HTMLDivElement>(null);

  // This ensures we only run this on the client
  const [parentSize, setParentSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (parentRef.current) {
      setParentSize({
        width: parentRef.current.offsetWidth,
        height: parentRef.current.offsetHeight,
      });
      // Set initial position based on parent size
      setPos({ 
        x: (parentRef.current.offsetWidth - 500) / 2, 
        y: (parentRef.current.offsetHeight - 300) / 2 
      });
    }
  }, []);

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
        setSize({ width: parentW, height: parentH * 0.3 });
        setPos({ x: 0, y: parentH * 0.7 });
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
        // Return to a default floating state
        setSize({ width: 500, height: 300 });
        setPos({ x: (parentW - 500) / 2, y: (parentH - 300) / 2 });
        break;
    }
  };

  const isDocked = position !== 'free';

  return (
    <div ref={parentRef} className="w-full h-full absolute top-0 left-0 pointer-events-none">
      {parentSize.width > 0 && (
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
               <CardTitle className="text-base">Transcripción</CardTitle>
             </div>
             <div className="flex items-center gap-1">
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-7 w-7"
                 onClick={() => handleSetPosition('top')}
                 aria-label="Anclar arriba"
               >
                 <ArrowBigUp className="h-4 w-4" />
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-7 w-7"
                 onClick={() => handleSetPosition('bottom')}
                 aria-label="Anclar abajo"
               >
                 <ArrowBigDown className="h-4 w-4" />
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-7 w-7"
                 onClick={() => handleSetPosition('left')}
                 aria-label="Anclar izquierda"
               >
                 <ArrowBigLeft className="h-4 w-4" />
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-7 w-7"
                 onClick={() => handleSetPosition('right')}
                 aria-label="Anclar derecha"
               >
                 <ArrowBigRight className="h-4 w-4" />
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-7 w-7"
                 onClick={() => handleSetPosition('free')}
                 aria-label="Posición inicial"
               >
                 <Maximize className="h-4 w-4" />
               </Button>
             </div>
           </CardHeader>
           <CardContent className="p-4 flex-grow overflow-auto">
             <p className="text-sm text-muted-foreground">
              {isDocked ? "Haz doble clic en la barra superior para liberar el panel." : "El texto de la transcripción aparecerá aquí..."}
             </p>
           </CardContent>
         </Card>
       </Rnd>
      )}
    </div>
  );
}
