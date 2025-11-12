'use client';

import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  brushColor: string;
  clear: boolean;
}

export function DrawingCanvas({ brushColor, clear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
        // Guarda el estado actual del canvas
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        // Redimensiona
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        context.scale(2, 2);
        context.lineCap = 'round';
        context.lineWidth = 5;
        // Restaura la imagen
        context.putImageData(imageData, 0, 0);
        // Reaplica el color, ya que se puede perder
        context.strokeStyle = contextRef.current?.strokeStyle || '#000';
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
    }
  }, [brushColor]);

  // Limpiar el canvas cuando se active la prop `clear`
  useEffect(() => {
    if (clear && contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [clear]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseUp={finishDrawing}
      onMouseMove={draw}
      onMouseLeave={finishDrawing} // Termina de dibujar si el cursor sale del canvas
      className="absolute top-0 left-0 z-10"
      // pointer-events-auto para que reciba eventos de ratón
    />
  );
}
