'use client';

import { useRef, useEffect, useCallback } from 'react';
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
    ArrowLeftRight
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
}

export function NotesPanel({
    studentClassName,
    sessionId,
    startTime,
    onClose,
    side,
    onToggleSide
}: NotesPanelProps) {
    const { style, theme } = useStyle();
    const { toast } = useToast();
    const editableRef = useRef<HTMLDivElement>(null);

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem('student_notes');
        if (saved && editableRef.current) {
            editableRef.current.innerHTML = saved;
        }
    }, []);

    const saveToLocalStorage = useCallback(() => {
        if (editableRef.current) {
            localStorage.setItem('student_notes', editableRef.current.innerHTML);
        }
    }, []);

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editableRef.current?.focus();
        saveToLocalStorage();
    };

    const getHighlightColor = (color: string) => {
        if (theme === 'dark') {
            if (color === 'yellow') return '#ca8a04';
            if (color === 'green') return '#16a34a';
            if (color === 'red') return '#dc2626';
        }
        if (theme === 'protanopia' || theme === 'deuteranopia') {
            if (color === 'yellow') return '#bfdbfe'; // Azul
            if (color === 'green') return '#fed7aa'; // Naranja
            if (color === 'red') return '#e9d5ff'; // Morado
        }
        if (color === 'yellow') return '#fef08a';
        if (color === 'green') return '#bbf7d0';
        if (color === 'red') return '#fecaca';
        return '#fef08a';
    };

    const handleCopy = () => {
        if (editableRef.current) {
            const text = editableRef.current.innerText;
            navigator.clipboard.writeText(text);
            toast({
                title: 'Copiado',
                description: 'Las notas se han copiado al portapapeles.',
            });
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
        toast({
            title: 'Generando PDF...',
            description: 'Por favor, espera un momento.',
        });

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;

        // Header similar to transcription
        function formatDate(date: Date): string {
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
        function formatTime(date: Date): string {
            return date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        }

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        const title = studentClassName ? `Notas: ${studentClassName}` : 'Notas de la Clase';
        pdf.text(title, margin, margin);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        let metaY = margin + 8;
        pdf.text(`Fecha: ${formatDate(endTime)}`, margin, metaY);
        metaY += 4;
        pdf.text(`Sala: ${sessionId}`, margin, metaY);
        metaY += 4;
        if (startTime) {
            pdf.text(`Hora de inicio: ${formatTime(startTime)}`, margin, metaY);
            metaY += 4;
        }
        pdf.text(`Hora de finalizacion: ${formatTime(endTime)}`, margin, metaY);
        metaY += 4;

        pdf.setLineWidth(0.5);
        pdf.line(margin, metaY + 2, pageWidth - margin, metaY + 2);

        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let position = metaY + 7;

        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);

        const fileName = studentClassName
            ? `notas-${studentClassName.replace(/\s+/g, '_')}.pdf`
            : `notas-${sessionId}.pdf`;
        pdf.save(fileName);

        toast({
            title: 'PDF Generado',
            description: 'La descarga de tus notas ha comenzado.',
        });
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleSide}>
                                <ArrowLeftRight className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mover a la {side === 'left' ? 'derecha' : 'izquierda'}</TooltipContent>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFormat('bold')}>
                                <Bold className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Negrita</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFormat('italic')}>
                                <Italic className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cursiva</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFormat('backColor', getHighlightColor('yellow'))}>
                                <div className="h-3.5 w-3.5 rounded-full border border-foreground/20" style={{ backgroundColor: getHighlightColor('yellow') }} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Marcatextos Amarillo</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFormat('backColor', getHighlightColor('green'))}>
                                <div className="h-3.5 w-3.5 rounded-full border border-foreground/20" style={{ backgroundColor: getHighlightColor('green') }} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Marcatextos Verde</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFormat('backColor', getHighlightColor('red'))}>
                                <div className="h-3.5 w-3.5 rounded-full border border-foreground/20" style={{ backgroundColor: getHighlightColor('red') }} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Marcatextos Rojo</TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-0.5 ml-auto">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar texto</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportTxt}>
                                <FileDown className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Exportar .txt</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportPdf}>
                                <FileText className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Exportar .pdf</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <CardContent className="p-0 flex-grow overflow-hidden min-h-0 bg-background">
                <ScrollArea className="h-full">
                    <div
                        ref={editableRef}
                        contentEditable
                        className="editable-content p-4 outline-none min-h-full break-words"
                        style={{ ...style, color: 'var(--foreground)' }}
                        onInput={saveToLocalStorage}
                        suppressContentEditableWarning={true}
                    />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
