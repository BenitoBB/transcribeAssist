'use client';

import { useRef, useEffect } from 'react';
import React from 'react';
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
    Copy,
    FileDown,
    FileText,
    X,
    ArrowLeftRight,
    Trash2,
    Eraser
} from 'lucide-react';
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
}

export function NotesPanel({
    studentClassName,
    sessionId,
    startTime,
    onClose,
    side,
    onToggleSide,
    initialContent,
    onContentChange
}: NotesPanelProps) {
    const { style, theme } = useStyle();
    const { toast } = useToast();
    const editableRef = useRef<HTMLDivElement>(null);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (isFirstLoad.current && editableRef.current) {
            editableRef.current.innerHTML = initialContent;
            isFirstLoad.current = false;
        }
    }, [initialContent]);

    const handleFormat = (command: string, value?: string) => {
        if (!editableRef.current) return;
        editableRef.current.focus();
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand(command, false, value);
        onContentChange(editableRef.current.innerHTML);
    };

    const getHighlightColor = (color: string): string => {
        if (theme === 'dark') {
            if (color === 'yellow') return 'rgb(202, 138, 4)';
            if (color === 'green') return 'rgb(22, 163, 74)';
            if (color === 'red') return 'rgb(220, 38, 38)';
        }
        if (theme === 'protanopia' || theme === 'deuteranopia') {
            if (color === 'yellow') return 'rgb(191, 219, 254)';
            if (color === 'green') return 'rgb(254, 215, 170)';
            if (color === 'red') return 'rgb(233, 213, 255)';
        }
        if (color === 'yellow') return 'rgb(254, 240, 138)';
        if (color === 'green') return 'rgb(187, 247, 208)';
        if (color === 'red') return 'rgb(254, 202, 202)';
        return 'rgb(254, 240, 138)';
    };

    const handleToggleHighlight = (colorName: string) => {
        if (!editableRef.current) return;
        editableRef.current.focus();

        const targetRGB = getHighlightColor(colorName);
        document.execCommand('styleWithCSS', false, 'true');

        // Obtenemos el color actual. P2P: queryCommandValue devuelve RGB en la mayoría de navegadores modernos.
        const currentColor = document.queryCommandValue('backColor').replace(/\s/g, '').toLowerCase();
        const targetNormalized = targetRGB.replace(/\s/g, '').toLowerCase();

        // Comprobamos si el color actual es el mismo que el objetivo para alternar (quitarlo)
        if (currentColor === targetNormalized) {
            // Para quitar el color de fondo usando styleWithCSS, a veces funciona 'transparent' o 'initial'
            // pero la forma más segura es resetearlo a un valor nulo.
            document.execCommand('backColor', false, 'transparent');
            // Si no funciona transparent, intentamos con inherit o simplemente null
            if (document.queryCommandValue('backColor') === currentColor) {
                document.execCommand('backColor', false, 'rgba(0,0,0,0)');
            }
        } else {
            document.execCommand('backColor', false, targetRGB);
        }

        onContentChange(editableRef.current.innerHTML);
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
        function formatTime(date: Date): string { return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

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

    return (
        <Card className="w-80 sm:w-96 flex flex-col shadow-lg border-2 border-primary/10 h-full overflow-hidden">
            <CardHeader className="p-3 border-b flex flex-row items-center justify-between gap-1 overflow-hidden shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    <CardTitle className="text-sm font-bold truncate">
                        {panelTitle}
                    </CardTitle>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <div className="p-2 border-b bg-muted/30 flex flex-wrap items-center justify-between gap-1 shrink-0">
                <div className="flex items-center gap-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }}>
                                <Bold className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Negrita</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }}>
                                <Italic className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cursiva</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Botón de Borrador / Quitar marcado */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onMouseDown={(e) => { e.preventDefault(); handleRemoveFormat(); }}
                            >
                                <Eraser className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Quitar marcador</TooltipContent>
                    </Tooltip>

                    {/* Marcatextos - Toggle: pulsar el mismo color lo quita */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onMouseDown={(e) => { e.preventDefault(); handleToggleHighlight('yellow'); }}
                            >
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: getHighlightColor('yellow') }} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Amarillo (Pulsar de nuevo para quitar)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onMouseDown={(e) => { e.preventDefault(); handleToggleHighlight('green'); }}
                            >
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: getHighlightColor('green') }} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Verde (Pulsar de nuevo para quitar)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onMouseDown={(e) => { e.preventDefault(); handleToggleHighlight('red'); }}
                            >
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: getHighlightColor('red') }} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rojo (Pulsar de nuevo para quitar)</TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-0.5 ml-auto">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onMouseDown={(e) => { e.preventDefault(); handleClearAll(); }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Borrar todo</TooltipContent>
                    </Tooltip>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportTxt}>
                                <FileDown className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>.txt</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportPdf}>
                                <FileText className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>.pdf</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <CardContent className="p-0 flex-grow overflow-hidden bg-background">
                <ScrollArea className="h-full">
                    <div
                        ref={editableRef}
                        contentEditable
                        className="editable-content p-4 outline-none min-h-[100%] break-words bg-background"
                        style={{
                            ...style,
                            color: 'var(--foreground)',
                            caretColor: 'var(--foreground)'
                        }}
                        onInput={() => onContentChange(editableRef.current?.innerHTML || '')}
                        suppressContentEditableWarning={true}
                    />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
