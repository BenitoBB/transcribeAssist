'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { Pencil, Mic, MicOff, NotebookPen, X, Play, Camera } from 'lucide-react';
import { DrawingToolbar } from '@/features/whiteboard/components/DrawingToolbar';
import { NotesPanel } from '@/features/notes/components/NotesPanel';
import { ExitConfirmation } from '@/components/ExitConfirmation';
import { useTranscription } from '@/features/transcription/hooks/use-transcription';
import { Command, Position } from '@/features/transcription/components/TranscriptionPanel';
import {
    startTranscription,
    stopTranscription,
    registerCommands,
    onStateChange,
    onTranscriptionUpdate,
} from '@/features/transcription/services/transcription.service';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_TRANSCRIPTION_TEXT } from '@/features/transcription/context/TranscriptionContext';

const DrawingCanvas = dynamic(
    () => import('@/features/whiteboard/components/DrawingCanvas').then(mod => mod.DrawingCanvas),
    { ssr: false }
);

const TranscriptionPanel = dynamic(
    () => import('@/features/transcription/components/TranscriptionPanel').then(mod => mod.TranscriptionPanel),
    { ssr: false }
);

export default function SoloPage() {
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [brushColor, setBrushColor] = useState('#FF0000');
    const [clearCanvas, setClearCanvas] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isNarrow, setIsNarrow] = useState(false); // Para apilar paneles cuando no caben lado a lado
    const [currentTool, setCurrentTool] = useState<'pencil' | 'text' | 'eraser' | 'none'>('pencil');
    const [isScreenshotMode, setIsScreenshotMode] = useState(false);

    const { transcription, setTranscription, isRecording, setIsRecording } = useTranscription();
    const { toast } = useToast();
    const router = useRouter();

    const [panelCommand, setPanelCommand] = useState<Command>(null);
    const [panelPosition, setPanelPosition] = useState<Position>('free');

    // Sincronizar herramienta con el modo dibujo (igual que en TeacherPage)
    useEffect(() => {
        if (!isDrawingMode) {
            setCurrentTool('none');
        } else if (currentTool === 'none') {
            setCurrentTool('pencil');
        }
    }, [isDrawingMode]);

    // Panel de Notas
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [notesSide, setNotesSide] = useState<'left' | 'right'>('right');
    const [notesContent, setNotesContent] = useState('');

    // Redimensionamiento horizontal (Solo para desktop)
    const [notesWidth, setNotesWidth] = useState(384);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const startResizing = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = (e: MouseEvent) => {
        if (isResizing && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            let newWidth;
            if (notesSide === 'right') {
                newWidth = containerRect.right - e.clientX;
            } else {
                newWidth = e.clientX - containerRect.left;
            }
            const minWidth = 250;
            const maxWidth = containerRect.width * 0.6;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setNotesWidth(newWidth);
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing]);

    useEffect(() => {
        const checkBreakpoints = () => {
            setIsMobile(window.innerWidth < 768);
            setIsNarrow(window.innerWidth < 1024); // Apilamos paneles por debajo de 1024px
        };
        checkBreakpoints();
        window.addEventListener('resize', checkBreakpoints);
        return () => window.removeEventListener('resize', checkBreakpoints);
    }, []);

    useEffect(() => {
        const handleStateChange = (newState: 'recording' | 'stopped' | 'idle') => {
            setIsRecording(newState === 'recording');
        };

        const handleTextUpdate = (newText: string, isFinal: boolean) => {
            setTranscription(newText);
        };

        const unsubState = onStateChange(handleStateChange);
        const unsubText = onTranscriptionUpdate(handleTextUpdate);

        return () => {
            unsubState();
            unsubText();
        };
    }, [setIsRecording, setTranscription]);

    const executeCommand = useCallback((command: string) => {
        const cleanedCommand = command.toLowerCase().trim().replace(/[.,;:]/g, '');

        const commandActions: { [key: string]: () => void } = {
            'iniciar grabación': () => startTranscription().catch(console.error),
            'detener grabación': stopTranscription,
            'activar pizarra': () => setIsDrawingMode(true),
            'cerrar pizarra': () => setIsDrawingMode(false),
            'pizarra arriba': () => setPanelCommand('top'),
            'pizarra abajo': () => setPanelCommand('bottom'),
            'pizarra derecha': () => setPanelCommand('right'),
            'pizarra izquierda': () => setPanelCommand('left'),
            'pizarra centro': () => setPanelCommand('free'),
        };

        if (commandActions[cleanedCommand]) {
            commandActions[cleanedCommand]();
            if (['top', 'bottom', 'right', 'left', 'free'].some(c => cleanedCommand.includes(c))) {
                setTimeout(() => setPanelCommand(null), 100);
            }
        }
    }, []);

    useEffect(() => {
        const unsubscribe = registerCommands(executeCommand);
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [executeCommand]);

    const handleClearCanvas = () => {
        setClearCanvas(true);
        setTimeout(() => setClearCanvas(false), 50);
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            stopTranscription();
        } else {
            startTranscription(false).catch(console.error);
        }
    };

    const handleContinueRecording = () => {
        startTranscription(true).catch(console.error);
    };

    return (
        <div className="relative min-h-screen w-screen overflow-y-auto bg-background">
            {isScreenshotMode ? (
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="default"
                                size="icon"
                                className="rounded-full h-10 w-10 shadow-lg border-2 bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={async () => {
                                    const element = document.getElementById('whiteboard-container');
                                    if (element) {
                                        try {
                                            toast({ title: 'Capturando...', description: 'Generando imagen de la pizarra.' });
                                            const html2canvas = (await import('html2canvas')).default;
                                            const canvas = await html2canvas(element, { backgroundColor: null });
                                            const dataUrl = canvas.toDataURL('image/png');
                                            
                                            // En sesión individual, descargamos la imagen
                                            const link = document.createElement('a');
                                            link.href = dataUrl;
                                            link.download = `captura-pizarra-${new Date().getTime()}.png`;
                                            link.click();
                                            
                                            toast({ title: '¡Captura descargada!', description: 'La imagen de la pizarra se ha guardado en tu equipo.', className: 'bg-green-600 text-white' });
                                        } catch (err) {
                                            console.error(err);
                                            toast({ title: 'Error', description: 'No se pudo capturar la pizarra.', variant: 'destructive' });
                                        }
                                    }
                                }}
                            >
                                <Camera className="h-5 w-5" />
                                <span className="sr-only">Tomar y descargar captura</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Descargar Captura de Pizarra</p></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full h-10 w-10 shadow-lg border-2 bg-background hover:bg-accent"
                                onClick={() => setIsScreenshotMode(false)}
                            >
                                <X className="h-5 w-5" />
                                <span className="sr-only">Salir del modo captura</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Salir de Modo Captura</p></TooltipContent>
                    </Tooltip>
                </div>
            ) : (
                <div className={cn(
                    "absolute z-30 flex items-center gap-2 transition-all duration-300",
                    {
                        'top-4 left-4 sm:top-8 sm:left-8': panelPosition === 'free' || panelPosition === 'right' || panelPosition === 'bottom',
                        'top-4 right-4 sm:top-8 sm:right-8': panelPosition === 'left',
                        'bottom-4 left-4 sm:bottom-8 sm:left-8': panelPosition === 'top',
                    }
                )}>
                    <ExitConfirmation
                        transcriptionText={transcription}
                        notesContent={notesContent}
                        tooltipText="Volver a la página principal"
                    />
                    {!isMobile && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                                    aria-pressed={isDrawingMode}
                                >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Activar modo dibujo</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Activar/Desactivar Pizarra</p></TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={isRecording ? 'destructive' : 'outline'}
                                size="icon"
                                onClick={handleToggleRecording}
                            >
                                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                <span className="sr-only">{isRecording ? 'Detener' : 'Iniciar'} transcripción</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isRecording ? 'Detener' : 'Iniciar'} Transcripción</p></TooltipContent>
                    </Tooltip>

                    {!isRecording && transcription !== '' && transcription !== DEFAULT_TRANSCRIPTION_TEXT && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleContinueRecording}
                                    className="border-primary text-primary hover:bg-primary/10"
                                >
                                    <Play className="h-4 w-4" />
                                    <span className="sr-only">Continuar grabación</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Continuar Grabación</p></TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={isNotesOpen ? "default" : "outline"}
                                size="icon"
                                onClick={() => setIsNotesOpen(!isNotesOpen)}
                                className={isNotesOpen ? "bg-primary text-primary-foreground" : ""}
                            >
                                <NotebookPen className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isNotesOpen ? 'Cerrar Notas' : 'Mis Notas'}</p></TooltipContent>
                    </Tooltip>
                </div>
            )}

            {!isScreenshotMode && (
                <div className={cn(
                    "absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:flex items-center gap-4 transition-all duration-300",
                    panelPosition === 'top' ? 'bottom-8' : 'top-8',
                    isDrawingMode && "opacity-0 invisible min-[1200px]:opacity-100 min-[1200px]:visible min-[1200px]:-translate-x-[350px]"
                )}>
                    <h2 className="text-3xl font-bold bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm whitespace-nowrap">
                        Sesión Individual
                    </h2>
                </div>
            )}

            {!isMobile && (
                <div id="whiteboard-container" className="absolute top-0 left-0 w-full h-full pointer-events-none z-5">
                    <DrawingCanvas
                        brushColor={brushColor}
                        tool={currentTool}
                        clear={clearCanvas}
                        isActive={isDrawingMode}
                    />
                </div>
            )}

            {!isMobile && isDrawingMode && !isScreenshotMode && (
                <DrawingToolbar
                    onColorChange={setBrushColor}
                    onToolChange={(tool) => setCurrentTool(prev => prev === tool ? 'none' : tool)}
                    onClear={handleClearCanvas}
                    onSnapshotMode={() => setIsScreenshotMode(true)}
                    onClose={() => setIsDrawingMode(false)}
                    currentColor={brushColor}
                    currentTool={currentTool}
                />
            )}

            {!isScreenshotMode && (
                <div className="relative min-h-screen w-screen overflow-y-auto bg-background flex items-center justify-center">
                    <style jsx global>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 8px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: rgba(var(--primary-rgb), 0.2);
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: rgba(var(--primary-rgb), 0.4);
                        }
                        .custom-scrollbar {
                            scrollbar-width: thin;
                            scrollbar-color: rgba(var(--primary-rgb), 0.2) transparent;
                        }
                    `}</style>
                    
                    <div 
                        ref={containerRef}
                        className={cn(
                            "flex w-full items-stretch justify-center pointer-events-none transition-all duration-300 gap-0 p-4",
                            isNotesOpen ? "max-w-7xl h-[60vh]" : "max-w-4xl h-[60vh]",
                            isNarrow && isNotesOpen ? "flex-col overflow-y-auto pt-20" : "flex-row",
                            isNotesOpen && notesSide === 'left' && !isNarrow ? 'flex-row-reverse' : ''
                        )}
                    >
                        {/* Panel de Transcripción */}
                        <div className={cn(
                            "relative pointer-events-auto h-full transition-all duration-300 min-w-0",
                            isNotesOpen ? "flex-1" : "w-full"
                        )}>
                            <TranscriptionPanel
                                command={panelCommand}
                                onPositionChange={setPanelPosition}
                                sessionId="Solo"
                                showResizeIcon={false}
                                isStatic={isNotesOpen && !isMobile}
                                onToggleSide={() => setNotesSide(prev => prev === 'left' ? 'right' : 'left')}
                            />
                        </div>

                        {/* Separador Redimensionable (Gutter) */}
                        {isNotesOpen && !isNarrow && (
                            <div
                                onMouseDown={startResizing}
                                className={cn(
                                    "w-3 hover:bg-primary/20 cursor-col-resize flex items-center justify-center transition-colors group z-50 pointer-events-auto",
                                    isResizing ? "bg-primary/30" : ""
                                )}
                            >
                                <div className="w-1.5 h-16 bg-border rounded-full group-hover:bg-primary/40 transition-colors" />
                            </div>
                        )}

                        {/* Panel de Notas */}
                        {isNotesOpen && (
                            <div 
                                className={cn(
                                    "relative pointer-events-auto h-full transition-all duration-300 min-w-[250px]",
                                    isNarrow ? "w-full min-h-[400px]" : ""
                                )}
                                style={!isNarrow ? { width: notesWidth } : {}}
                            >
                                <NotesPanel
                                    studentClassName="Sesión Individual"
                                    sessionId="Solo"
                                    startTime={new Date()}
                                    onClose={() => setIsNotesOpen(false)}
                                    side={notesSide}
                                    onToggleSide={() => setNotesSide(prev => prev === 'left' ? 'right' : 'left')}
                                    initialContent={notesContent}
                                    onContentChange={setNotesContent}
                                    isMobile={isNarrow}
                                    isStatic={!isMobile}
                                    showResizeIcon={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
