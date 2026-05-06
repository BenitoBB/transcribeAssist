'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Bold,
    Italic,
    Underline,
    Copy,
    Download,
    FileText,
    X,
    ArrowLeftRight,
    Trash2,
    Eraser,
    ChevronDown,
    GripVertical,
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
import { useStyle } from '@/context/StyleContext';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface NotesPanelProps {
    studentClassName?: string;
    sessionId: string;
    startTime: Date | null;
    onClose: () => void;
    side: 'left' | 'right';
    onToggleSide: () => void;
    initialContent: string;
    onContentChange: (content: string) => void;
    isMobile?: boolean;
    customWidth?: number;
    disableScroll?: boolean;
    freeFloating?: boolean;
    isStatic?: boolean;
    showResizeIcon?: boolean;
}

export function NotesPanel({
    studentClassName,
    sessionId,
    startTime,
    onClose,
    side,
    onToggleSide,
    initialContent,
    onContentChange,
    isMobile = false,
    customWidth,
    disableScroll = false,
    freeFloating = false,
    isStatic = false,
    showResizeIcon = false
}: NotesPanelProps) {
    const { style, theme } = useStyle();
    const { toast } = useToast();
    const editableRef = useRef<HTMLDivElement>(null);
    const isFirstLoad = useRef(true);

    const [recentColors, setRecentColors] = useState<string[]>(['yellow', 'green', 'red']);
    const [floatingMenuProps, setFloatingMenuProps] = useState<{ show: boolean, top: number, left: number }>({ show: false, top: 0, left: 0 });

    // Estados para libre flotamiento (similar a TranscriptionPanel)
    const [pos, setPos] = useState({ x: 750, y: 150 });
    const [size, setSize] = useState({ width: 450, height: 500 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    const fontFamilies = [
        { label: 'Inter', value: 'Inter, sans-serif' },
        { label: 'Arial', value: 'Arial, sans-serif' },
        { label: 'Verdana', value: 'Verdana, sans-serif' },
        { label: 'Dislexia', value: "'Open Dyslexic', sans-serif" }
    ];

    const fontSizes = [
        { label: 'Pequeña', value: '2' },
        { label: 'Normal', value: '3' },
        { label: 'Grande', value: '4' },
        { label: 'Muy grande', value: '5' },
        { label: 'Título', value: '6' },
    ];

    const ALL_COLORS = ['yellow', 'green', 'red', 'blue', 'orange', 'purple', 'pink', 'teal', 'gray'];

    useEffect(() => {
        if (isFirstLoad.current && editableRef.current) {
            editableRef.current.innerHTML = initialContent;
            isFirstLoad.current = false;
        }
    }, [initialContent]);

    // Lógica de Arrastre
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!freeFloating || isMobile) return;
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y,
        };
        e.preventDefault();
    }, [freeFloating, isMobile, pos]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPos({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y,
            });
        }
        if (isResizing) {
            const dx = e.clientX - resizeStartRef.current.x;
            const dy = e.clientY - resizeStartRef.current.y;
            setSize({
                width: Math.max(300, resizeStartRef.current.width + dx),
                height: Math.max(300, resizeStartRef.current.height + dy),
            });
        }
    }, [isDragging, isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    const handleResizeMouseDown = (e: React.MouseEvent) => {
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

    // Lógica del Floating Toolbar (Tooltip de selección)
    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && editableRef.current && editableRef.current.contains(selection.anchorNode)) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const containerRect = editableRef.current.getBoundingClientRect();

                // Usamos dimensiones fijas estimadas para el cálculo de colisiones con bordes
                const TB_WIDTH = 340; 
                const TB_HEIGHT = 45;

                // Detectamos "primera línea" relativo al contenedor de notas (containerRect)
                const isNearEditorTop = (rect.top - containerRect.top) < 60;
                
                // Si está cerca del borde superior del editor, lo forzamos abajo.
                // Si no, lo ponemos arriba de la selección.
                const topOffset = isNearEditorTop ? rect.height + 5 : -(TB_HEIGHT + 5);
                
                setFloatingMenuProps({
                    show: true,
                    top: rect.top + topOffset,
                    left: Math.max(10, Math.min(window.innerWidth - TB_WIDTH - 10, rect.left + (rect.width / 2) - (TB_WIDTH / 2)))
                });
            } else {
                setFloatingMenuProps(prev => prev.show ? { ...prev, show: false } : prev);
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    const handleFormat = (command: string, value?: string) => {
        if (!editableRef.current) return;

        // Evitaremos hacer focus si venimos de un botón externo para no romper selecciones flotantes, 
        // pero normalmente designMode/execCommand pide focus.
        if (document.activeElement !== editableRef.current) {
            // Si el foco no está, no forzamos para comandos como fontName desde el FloatingMenu.
            // Solo si es necesario:
        }

        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand(command, false, value);
        onContentChange(editableRef.current.innerHTML);
    };

    const getHighlightColor = (color: string): string => {
        if (theme === 'dark') {
            if (color === 'yellow') return 'rgb(202, 138, 4)';
            if (color === 'green') return 'rgb(22, 163, 74)';
            if (color === 'red') return 'rgb(220, 38, 38)';
            if (color === 'blue') return 'rgb(37, 99, 235)';
            if (color === 'orange') return 'rgb(234, 88, 12)';
            if (color === 'purple') return 'rgb(147, 51, 234)';
            if (color === 'pink') return 'rgb(219, 39, 119)';
            if (color === 'teal') return 'rgb(13, 148, 136)';
            if (color === 'gray') return 'rgb(75, 85, 99)';
        }
        if (theme === 'protanopia' || theme === 'deuteranopia') {
            if (color === 'yellow') return 'rgb(191, 219, 254)';
            if (color === 'green') return 'rgb(254, 215, 170)';
            if (color === 'red') return 'rgb(233, 213, 255)';
            if (color === 'blue') return 'rgb(103, 232, 249)';
            if (color === 'orange') return 'rgb(167, 243, 208)';
            if (color === 'purple') return 'rgb(254, 202, 202)';
            if (color === 'pink') return 'rgb(217, 249, 157)';
            if (color === 'teal') return 'rgb(254, 215, 170)';
            if (color === 'gray') return 'rgb(229, 231, 235)';
        }
        if (color === 'yellow') return 'rgb(254, 240, 138)';
        if (color === 'green') return 'rgb(187, 247, 208)';
        if (color === 'red') return 'rgb(254, 202, 202)';
        if (color === 'blue') return 'rgb(191, 219, 254)';
        if (color === 'orange') return 'rgb(254, 215, 170)';
        if (color === 'purple') return 'rgb(233, 213, 255)';
        if (color === 'pink') return 'rgb(251, 207, 232)';
        if (color === 'teal') return 'rgb(153, 246, 228)';
        if (color === 'gray') return 'rgb(229, 231, 235)';
        return 'rgb(254, 240, 138)';
    };

    const handleToggleHighlight = (colorName: string) => {
        if (!editableRef.current) return;
        editableRef.current.focus();

        const colorVar = `var(--highlight-${colorName})`;
        const appliedColor = getHighlightColor(colorName);

        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('backColor', false, appliedColor);

        // Limpiar el HTML: Reemplazamos el color fijo aplicado por el navegador con nuestra variable CSS reactiva
        // El navegador a veces pone espacios o comas de forma distinta, así que usamos una regex flexible
        const fixedColorRegex = appliedColor.replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/,/g, ',\\s*');
        const content = editableRef.current.innerHTML.replace(
            new RegExp(`background-color:\\s*${fixedColorRegex}`, 'gi'),
            `background-color: ${colorVar}`
        );

        // Cuidar el historial
        setRecentColors(prev => {
            const newHistory = [colorName, ...prev.filter(c => c !== colorName)];
            return newHistory.slice(0, 3);
        });

        editableRef.current.innerHTML = content;
        onContentChange(content);
    };

    const handleRemoveFormat = () => {
        if (!editableRef.current) return;
        editableRef.current.focus();
        // Limpia solo el color de fondo (marcatextos) de la selección
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('backColor', false, 'transparent');
        onContentChange(editableRef.current.innerHTML);
    };

    const handleClearAll = () => {
        if (editableRef.current) {
            editableRef.current.innerHTML = '';
            onContentChange('');
            toast({ title: 'Notas borradas', description: 'Todo el contenido ha sido eliminado.' });
        }
    };

    const handleCopy = () => {
        if (editableRef.current) {
            const text = editableRef.current.innerText;
            navigator.clipboard.writeText(text);
            toast({ title: 'Copiado', description: 'Notas copiadas al portapapeles.' });
        }
    };

    const handleExportTxt = () => {
        if (editableRef.current) {
            const text = editableRef.current.innerText;
            const title = studentClassName ? `Notas de ${studentClassName}` : 'Notas';
            const blob = new Blob([`${title}\n\n${text}`], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleExportPdf = async () => {
        const element = editableRef.current;
        if (!element) return;
        const endTime = new Date();
        toast({ title: 'Generando PDF...', description: 'Espera un momento.' });

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 15;
        function formatDate(date: Date): string { return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }); }
        function formatTime(date: Date): string { return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(studentClassName ? `Notas: ${studentClassName}` : 'Notas de la Clase', margin, margin);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        let metaY = margin + 8;
        pdf.text(`Fecha: ${formatDate(endTime)}`, margin, metaY);
        metaY += 3;
        pdf.text(`Sala: ${sessionId}`, margin, metaY);
        metaY += 3;
        if (startTime) { pdf.text(`Hora de inicio: ${formatTime(startTime)}`, margin, metaY); metaY += 3; }
        pdf.text(`Hora de finalizacion: ${formatTime(endTime)}`, margin, metaY);
        metaY += 3;

        pdf.setLineWidth(0.5);
        pdf.line(margin, metaY + 1, pageWidth - margin, metaY + 1);

        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', margin, metaY + 5, imgWidth, imgHeight);

        pdf.save(studentClassName ? `notas-${studentClassName.replace(/\s+/g, '_')}.pdf` : `notas-${sessionId}.pdf`);
    };

    const panelTitle = studentClassName ? `Notas de ${studentClassName}` : 'Notas';

    const panelCard = (
        <Card 
            ref={panelRef}
            className={cn(
                "flex flex-col shadow-2xl border-2 transition-all duration-200 overflow-hidden relative",
                !isStatic && freeFloating && !isMobile ? "fixed z-50 pointer-events-auto" : "h-full w-full",
                isMobile ? "max-h-[85vh]" : ""
            )}
            style={!isStatic && freeFloating && !isMobile ? {
                left: pos.x,
                top: pos.y,
                width: size.width,
                height: size.height,
                transition: isDragging || isResizing ? 'none' : 'all 0.2s ease-out'
            } : {
                width: !isMobile && customWidth ? `${customWidth}px` : '100%',
                maxWidth: '100vw',
                height: '100%'
            }}
        >
            {(isStatic || (freeFloating && !isMobile)) && showResizeIcon && (
                <div
                    className={cn(
                        "absolute bottom-0 right-0 w-6 h-6 z-50 flex items-center justify-center group cursor-nwse-resize"
                    )}
                    onMouseDown={handleResizeMouseDown}
                >
                    <Maximize2 className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors rotate-90" />
                </div>
            )}

            <CardHeader 
                className={cn(
                    "p-3 border-b flex flex-row items-center justify-between gap-1 overflow-hidden shrink-0 h-14 bg-muted/20",
                    !isStatic && freeFloating && !isMobile ? "cursor-move" : ""
                )}
                onMouseDown={!isStatic ? handleMouseDown : undefined}
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    <CardTitle className="text-sm font-bold truncate">
                        {panelTitle}
                    </CardTitle>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onMouseDown={(e) => { e.preventDefault(); handleClearAll(); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Borrar todo</TooltipContent>
                    </Tooltip>
                    
                    <div className="w-px h-4 bg-border mx-0.5" />
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar texto</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Exportar</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportTxt}>
                                <Download className="h-4 w-4 mr-2" /> Guardar como TXT
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPdf}>
                                <FileText className="h-4 w-4 mr-2" /> Guardar como PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-4 bg-border mx-0.5" />

                    {!isMobile && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onMouseDown={(e) => { e.preventDefault(); onToggleSide(); }}
                                >
                                    <ArrowLeftRight className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mover panel</TooltipContent>
                        </Tooltip>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <div className="p-1 sm:p-2 border-b bg-muted/30 shrink-0 overflow-x-auto no-scrollbar w-full touch-pan-x">
                <div className="flex items-center gap-0 sm:gap-0.5 min-w-max px-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }}>
                                <Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Negrita</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }}>
                                <Italic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cursiva</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onMouseDown={(e) => { e.preventDefault(); handleFormat('underline'); }}>
                                <Underline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Subrayado</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1" />

                    {/* Botón de Borrador / Quitar marcado */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
                                onMouseDown={(e) => { e.preventDefault(); handleRemoveFormat(); }}
                            >
                                <Eraser className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Quitar resaltado</TooltipContent>
                    </Tooltip>

                    {/* Marcatextos - Historial de 3 Colores Recientes */}
                    {recentColors.map(color => (
                        <Tooltip key={color}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                    onMouseDown={(e) => { e.preventDefault(); handleToggleHighlight(color); }}
                                >
                                    <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: getHighlightColor(color) }} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="capitalize"> {
                                color === 'yellow' ? 'Amarillo' :
                                    color === 'green' ? 'Verde' :
                                        color === 'red' ? 'Rojo' :
                                            color === 'blue' ? 'Azul' :
                                                color === 'orange' ? 'Naranja' :
                                                    color === 'purple' ? 'Púrpura' :
                                                        color === 'pink' ? 'Rosa' :
                                                            color === 'teal' ? 'Teal' : 'Gris'
                            }</TooltipContent>
                        </Tooltip>
                    ))}

                    {/* Menú de Selección de 9 Colores */}
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
                                {ALL_COLORS.map(color => (
                                    <Tooltip key={`drop-notes-${color}`}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-10 w-full flex justify-center items-center p-0 rounded-md hover:bg-muted"
                                                onMouseDown={(e) => { e.preventDefault(); handleToggleHighlight(color); }}
                                            >
                                                <div className="h-5 w-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: getHighlightColor(color) }} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="capitalize"> {
                                            color === 'yellow' ? 'Amarillo' :
                                                color === 'green' ? 'Verde' :
                                                    color === 'red' ? 'Rojo' :
                                                        color === 'blue' ? 'Azul' :
                                                            color === 'orange' ? 'Naranja' :
                                                                color === 'purple' ? 'Púrpura' :
                                                                    color === 'pink' ? 'Rosa' :
                                                                        color === 'teal' ? 'Teal' : 'Gris'
                                        }</TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>



            <CardContent className="p-0 flex-grow overflow-hidden bg-background">
                {(() => {
                    const Container = disableScroll ? 'div' : 'div'; // Siempre usamos div ahora para control total del scroll
                    const containerProps = { 
                        className: cn(
                            "h-full relative custom-scrollbar",
                            disableScroll ? "overflow-hidden" : "overflow-y-auto"
                        )
                    };
                    
                    return (
                        <Container {...containerProps}>
                            {/* Floating Toolbar rendered via Portal to avoid clipping */}
                            {floatingMenuProps.show && !isMobile && createPortal(
                                <div
                                    className="fixed z-[9999] flex items-center bg-background/95 backdrop-blur-md shadow-2xl border border-primary/20 rounded-lg py-1 px-2 gap-1 animate-in fade-in zoom-in-95 duration-200"
                                    style={{
                                        top: floatingMenuProps.top,
                                        left: floatingMenuProps.left,
                                        width: 'fit-content'
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 shadow-sm border bg-muted/50 rounded-md gap-1">
                                                Fuente <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {fontFamilies.map(font => (
                                                <DropdownMenuItem
                                                    key={`float-font-${font.value}`}
                                                    style={{ fontFamily: font.value }}
                                                    onClick={() => handleFormat('fontName', font.value)}
                                                >
                                                    {font.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 shadow-sm border bg-muted/50 rounded-md gap-1">
                                                Tamaño <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {fontSizes.map(size => (
                                                <DropdownMenuItem
                                                    key={`float-size-${size.value}`}
                                                    onClick={() => handleFormat('fontSize', size.value)}
                                                >
                                                    {size.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <div className="w-px h-4 bg-border mx-1" />
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('bold')}>
                                        <Bold className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('italic')}>
                                        <Italic className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('underline')}>
                                        <Underline className="h-3.5 w-3.5" />
                                    </Button>

                                    <div className="w-px h-4 bg-border mx-1" />

                                    {/* Borrador en Floating Menu */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        onClick={handleRemoveFormat}
                                    >
                                        <Eraser className="h-3.5 w-3.5" />
                                    </Button>

                                    <div className="w-px h-4 bg-border mx-1" />

                                    {/* Marcatextos Historial en Floating Menu */}
                                    {recentColors.map(color => (
                                        <Button
                                            key={`float-${color}`}
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => handleToggleHighlight(color)}
                                        >
                                            <div className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: getHighlightColor(color) }} />
                                        </Button>
                                    ))}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-6">
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="center" className="w-40 p-2">
                                            <div className="grid grid-cols-3 gap-1">
                                                {ALL_COLORS.map(color => (
                                                    <Button
                                                        key={`fdrop-${color}`}
                                                        variant="ghost"
                                                        className="h-8 w-full p-0 rounded-md"
                                                        onClick={() => handleToggleHighlight(color)}
                                                    >
                                                        <div className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: getHighlightColor(color) }} />
                                                    </Button>
                                                ))}
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>,
                                document.body
                            )}

                            <div
                                ref={editableRef}
                                contentEditable
                                className="editable-content p-4 outline-none min-h-[100%] break-words bg-background relative"
                                style={{
                                    ...style,
                                    color: 'var(--foreground)',
                                    caretColor: 'var(--foreground)'
                                }}
                                onInput={() => {
                                    if (!editableRef.current) return;
                                    onContentChange(editableRef.current.innerHTML);
                                }}
                                suppressContentEditableWarning={true}
                            />
                        </Container>
                    );
                })()}
            </CardContent>
        </Card>
    );

    return panelCard;
}
