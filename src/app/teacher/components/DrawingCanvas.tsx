'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, GripVertical } from 'lucide-react';

interface TextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface DrawingCanvasProps {
  brushColor: string;
  tool: 'pencil' | 'text' | 'eraser' | 'none';
  clear: boolean;
  isActive: boolean;
}

const TEXT_PLACEHOLDER = "Escribe algo...";

export function DrawingCanvas({ brushColor, tool, clear, isActive }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const activeBlockRef = useRef<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [draggingBlock, setDraggingBlock] = useState<{ id: string, startX: number, startY: number } | null>(null);

  // Efecto para enfocar automáticamente el nuevo bloque
  useEffect(() => {
    if (activeBlockRef.current) {
        // Usar setTimeout para asegurar que el DOM se haya renderizado
        const timer = setTimeout(() => {
            const element = document.getElementById(`text-block-${activeBlockRef.current}`);
            if (element) {
                element.focus();
                // Mover el cursor al final
                const range = document.createRange();
                const sel = window.getSelection();
                if (sel) {
                    range.selectNodeContents(element);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }, 10);
        return () => clearTimeout(timer);
    }
  }, [textBlocks.length]);

  // Limpiar bloques vacíos cuando se desactiva la herramienta de texto o la pizarra
  useEffect(() => {
    if (tool !== 'text' || !isActive) {
      setTextBlocks(prev => prev.filter(block => block.text.trim() !== ''));
    }
  }, [tool, isActive]);

  // Manejar el arrastre global de bloques de texto
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingBlock) {
        setTextBlocks(prev => prev.map(b => 
          b.id === draggingBlock.id 
            ? { ...b, x: e.clientX - draggingBlock.startX, y: e.clientY - draggingBlock.startY } 
            : b
        ));
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingBlock(null);
    };

    if (draggingBlock) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingBlock]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ajustar el tamaño del canvas al de la ventana
    canvas.width = window.innerWidth * 2; // Multiplicar por 2 para mayor resolución (Retina)
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.scale(2, 2); // Escalar el contexto para que coincida con el tamaño del canvas
    context.lineCap = 'round';
    context.strokeStyle = brushColor;
    context.lineWidth = 5;
    contextRef.current = context;

    const handleResize = () => {
        if (!contextRef.current || !canvasRef.current) return;
        // Guarda el estado actual del canvas
        const imageData = contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        // Redimensiona
        canvasRef.current.width = window.innerWidth * 2;
        canvasRef.current.height = window.innerHeight * 2;
        canvasRef.current.style.width = `${window.innerWidth}px`;
        canvasRef.current.style.height = `${window.innerHeight}px`;
        contextRef.current.scale(2, 2);
        contextRef.current.lineCap = 'round';
        contextRef.current.lineWidth = 5;
        // Restaura la imagen
        contextRef.current.putImageData(imageData, 0, 0);
        // Reaplica el color, ya que se puede perder
        contextRef.current.strokeStyle = contextRef.current?.strokeStyle || '#000';
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
    }

  }, []);

  // Cambiar el color del pincel cuando cambie la prop
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = brushColor;
      contextRef.current.fillStyle = brushColor;
    }
    // Sincronizar el color del bloque de texto actual si está vacío
    setTextBlocks(prev => prev.map(block => 
        (block.text.trim() === '') ? { ...block, color: brushColor } : block
    ));
  }, [brushColor]);

  // Limpiar el canvas y los textos cuando se active la prop `clear`
  useEffect(() => {
    if (clear && contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setTextBlocks([]);
    }
  }, [clear]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive || tool === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'text') {
        const id = Math.random().toString(36).substr(2, 9);
        
        // Limpiar cualquier bloque vacío anterior antes de crear uno nuevo
        setTextBlocks(prev => {
            const filtered = prev.filter(b => b.text.trim() !== '');
            const newBlock: TextBlock = {
                id,
                text: '',
                x,
                y,
                color: brushColor,
            };
            activeBlockRef.current = id;
            return [...filtered, newBlock];
        });
        return;
    }

    if (tool === 'eraser') {
        contextRef.current.globalCompositeOperation = 'destination-out';
        contextRef.current.lineWidth = 30; // Borrador más ancho
    } else {
        contextRef.current.globalCompositeOperation = 'source-over';
        contextRef.current.lineWidth = 3;
    }

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const updateTextBlock = (id: string, text: string) => {
    setTextBlocks(prev => prev.map(block => 
        block.id === id ? { ...block, text } : block
    ));
  };

  const finishDrawing = () => {
    if (isDrawing && contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  const removeTextBlock = (id: string) => {
    setTextBlocks(prev => prev.filter(block => block.id !== id));
  };

  const startDragging = (blockId: string, e: React.MouseEvent) => {
    if (!isActive || tool !== 'text') return;
    const block = textBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    setDraggingBlock({
      id: blockId,
      startX: e.clientX - block.x,
      startY: e.clientY - block.y
    });
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
        className={cn(
          "absolute top-0 left-0 w-full h-full",
          (isActive && tool !== 'none') ? "pointer-events-auto" : "pointer-events-none",
          isActive && (
            tool === 'text' ? 'cursor-text' : 
            tool === 'eraser' ? 'cursor-crosshair' : 
            tool === 'pencil' ? 'cursor-crosshair' : 'cursor-default'
          )
        )}
      />
      {textBlocks.map((block) => (
        <div
          key={block.id}
          className="absolute z-20 group pl-10 py-2 bg-transparent flex items-center"
          style={{ left: block.x - 40, top: block.y - 8 }}
        >
          <div
            id={`text-block-${block.id}`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateTextBlock(block.id, e.currentTarget.textContent || '')}
            onBlur={(e) => {
              const text = e.currentTarget.textContent || '';
              if (text.trim() === '') {
                  removeTextBlock(block.id);
              }
            }}
            onFocus={() => {
              activeBlockRef.current = block.id;
            }}
            className={cn(
              "min-w-[120px] min-h-[1.5em] outline-none p-1 transition-all duration-200 rounded select-text relative flex items-center",
              (isActive && tool === 'text') ? 'pointer-events-auto focus:bg-primary/5 focus:ring-2 focus:ring-primary/40 border border-dashed border-primary/20 bg-background/40 backdrop-blur-[2px]' : 'pointer-events-none'
            )}
            style={{
              color: block.color,
              fontSize: '24px',
              fontFamily: 'var(--font-inter), sans-serif',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxWidth: '400px',
              boxShadow: (isActive && tool === 'text') ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
            }}
          >
              {block.text === '' && (
                  <span className="opacity-40 italic pointer-events-none text-sm absolute left-1 whitespace-nowrap">
                      {TEXT_PLACEHOLDER}
                  </span>
              )}
          </div>
          
          {isActive && tool === 'text' && (
            <>
              <div 
                onMouseDown={(e) => startDragging(block.id, e)}
                className={cn(
                  "absolute left-1 top-1/2 -translate-y-1/2 cursor-move p-2 transition-all z-30",
                  (draggingBlock?.id === block.id || draggingBlock === null) ? "opacity-30 group-hover:opacity-100" : "opacity-0",
                  draggingBlock?.id === block.id && "opacity-100 scale-125"
                )}
                title="Arrastrar para mover"
              >
                <GripVertical className={cn(
                  "h-5 w-5 transition-colors",
                  draggingBlock?.id === block.id ? "text-primary" : "text-muted-foreground hover:text-primary"
                )} />
              </div>

              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeTextBlock(block.id);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeTextBlock(block.id);
                }}
                className={cn(
                  "absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md transition-all z-30 flex items-center justify-center pointer-events-auto",
                  (draggingBlock?.id === block.id) ? "opacity-0 invisible" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:scale-110"
                )}
                title="Eliminar texto"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
