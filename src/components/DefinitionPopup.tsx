'use client';

import { X, LoaderCircle, GripVertical } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DefinitionPopupProps {
  word: string;
  definition: string | null;
  isLoading: boolean;
  onClose: () => void;
}

export function DefinitionPopup({
  word,
  definition,
  isLoading,
  onClose,
}: DefinitionPopupProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Centrar el popup al inicio
    setPosition({
      x: window.innerWidth / 2 - size.width / 2,
      y: window.innerHeight / 2 - size.height / 2,
    });
  }, [size.width, size.height]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    // Evitar la selección de texto mientras se arrastra
    e.preventDefault();
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && popupRef.current) {
      const parentBounds = popupRef.current.parentElement?.getBoundingClientRect();
      if (!parentBounds) return;

      let newX = e.clientX - dragStartRef.current.x;
      let newY = e.clientY - dragStartRef.current.y;

      // Limitar al viewport
      newX = Math.max(0, Math.min(newX, parentBounds.width - size.width));
      newY = Math.max(0, Math.min(newY, parentBounds.height - size.height));

      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, size.width, size.height]);


  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  return (
    <div
      ref={popupRef}
      className="z-50 flex flex-col bg-card rounded-lg shadow-2xl border absolute"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '250px',
        minHeight: '200px',
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="drag-handle cursor-move flex items-center justify-between p-2 border-b bg-muted/50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm truncate">Definición de "{word}"</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent flex-shrink-0"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-grow p-4 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="sr-only">Cargando definición...</p>
          </div>
        )}
        {!isLoading && definition && (
          <p className="text-sm text-foreground">{definition}</p>
        )}
        {!isLoading && !definition && (
          <p className="text-sm text-muted-foreground">
            No se encontró una definición para esta palabra.
          </p>
        )}
      </div>
    </div>
  );
}