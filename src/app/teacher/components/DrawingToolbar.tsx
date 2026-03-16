'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eraser, Palette, X, Type, MousePointer2, Camera, Trash2 } from 'lucide-react';

interface DrawingToolbarProps {
  onColorChange: (color: string) => void;
  onToolChange: (tool: 'pencil' | 'text' | 'eraser' | 'none') => void;
  onClear: () => void;
  onSnapshotMode: () => void;
  onClose: () => void;
  currentColor: string;
  currentTool: 'pencil' | 'text' | 'eraser' | 'none';
}

const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#000000', '#FFFFFF'];

export function DrawingToolbar({
  onColorChange,
  onToolChange,
  onClear,
  onSnapshotMode,
  onClose,
  currentColor,
  currentTool,
}: DrawingToolbarProps) {
  return (
    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-40 flex items-center gap-2 bg-card p-2 rounded-lg shadow-lg border">
      <div className="flex items-center gap-1 pr-2 border-r">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={currentTool === 'pencil' ? 'default' : 'ghost'} 
              size="icon" 
              onClick={() => onToolChange('pencil')}
              className="h-8 w-8"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Herramienta Pincel</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={currentTool === 'text' ? 'default' : 'ghost'} 
              size="icon" 
              onClick={() => onToolChange('text')}
              className="h-8 w-8"
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Herramienta Texto</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={currentTool === 'eraser' ? 'default' : 'ghost'} 
              size="icon" 
              onClick={() => onToolChange('eraser')}
              className="h-8 w-8"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Herramienta Borrador (Píxel)</p></TooltipContent>
        </Tooltip>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Palette className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-8 h-8 rounded-md cursor-pointer opacity-0"
              aria-label="Seleccionar color"
            />
             <div
              className="absolute top-0 left-0 w-8 h-8 rounded-md border pointer-events-none"
              style={{ backgroundColor: currentColor }}
            ></div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Color del Pincel</p>
        </TooltipContent>
      </Tooltip>
      
      {colors.map((color) => (
        <Tooltip key={color}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`w-8 h-8 rounded-md ${currentColor === color ? 'ring-2 ring-ring' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              aria-label={`Cambiar a color ${color}`}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{color}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onClear} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Limpiar todo</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Limpiar Todo (Borrar pizarra)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onSnapshotMode}>
            <Camera className="h-4 w-4" />
            <span className="sr-only">Modo captura</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Modo Captura (Ocultar Interfaz)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar pizarra</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cerrar Pizarra</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
