'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Pencil,
    Mic,
    MicOff,
    NotebookPen,
} from 'lucide-react';
import { DrawingToolbar } from '../teacher/components/DrawingToolbar';
import { NotesPanel } from '../student/components/NotesPanel';
import { useTranscription } from '@/hooks/use-transcription';
import { Command, Position } from '../teacher/components/TranscriptionPanel';
import {
    startTranscription,
    stopTranscription,
    registerCommands,
    onStateChange,
    onTranscriptionUpdate,
} from '@/lib/transcription';
import { cn } from '@/lib/utils';

const DrawingCanvas = dynamic(
    () => import('../teacher/components/DrawingCanvas').then(mod => mod.DrawingCanvas),
    { ssr: false }
);

const TranscriptionPanel = dynamic(
    () => import('../teacher/components/TranscriptionPanel').then(mod => mod.TranscriptionPanel),
    { ssr: false }
);

export default function SoloPage() {
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [brushColor, setBrushColor] = useState('#FF0000');
    const [clearCanvas, setClearCanvas] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const { transcription, setTranscription, isRecording, setIsRecording } = useTranscription();
    const router = useRouter();

    const [panelCommand, setPanelCommand] = useState<Command>(null);
    const [panelPosition, setPanelPosition] = useState<Position>('free');

    const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

    // Panel de Notas
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [notesSide, setNotesSide] = useState<'left' | 'right'>('right');
    const [notesContent, setNotesContent] = useState('');

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
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
            startTranscription().catch(console.error);
        }
    };

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-background">
            <div className={cn(
                "absolute z-30 flex items-center gap-2 transition-all duration-300",
                {
                    'top-4 left-4 sm:top-8 sm:left-8': panelPosition === 'free' || panelPosition === 'right' || panelPosition === 'bottom',
                    'top-4 right-4 sm:top-8 sm:right-8': panelPosition === 'left',
                    'bottom-4 left-4 sm:bottom-8 sm:left-8': panelPosition === 'top',
                }
            )}>
                <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    if (transcription || notesContent) {
                                        setIsExitDialogOpen(true);
                                    } else {
                                        router.push('/');
                                    }
                                }}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Volver</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Volver a la página principal</p></TooltipContent>
                    </Tooltip>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Estás seguro de que quieres salir?</DialogTitle>
                            <DialogDescription>
                                Si regresas a la página principal, se perderá el progreso de la transcripción y las notas tomadas en esta sesión.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() => router.push('/')}
                            >
                                Sí, salir y perder progreso
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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

            {!isMobile && isDrawingMode && (
                <>
                    <DrawingToolbar
                        onColorChange={setBrushColor}
                        onClear={handleClearCanvas}
                        onClose={() => setIsDrawingMode(false)}
                        currentColor={brushColor}
                    />
                    <DrawingCanvas brushColor={brushColor} clear={clearCanvas} />
                </>
            )}

            <div className="relative w-full h-full pointer-events-none z-10 flex items-center justify-center p-4">
                <div className={`flex w-full max-w-7xl gap-4 items-stretch justify-center h-[70vh] pointer-events-auto transition-all duration-300 ${isNotesOpen && notesSide === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-1 min-w-0 relative h-full">
                        <TranscriptionPanel command={panelCommand} onPositionChange={setPanelPosition} />
                    </div>

                    {isNotesOpen && (
                        <NotesPanel
                            studentClassName="Sesión Individual"
                            sessionId="Solo"
                            startTime={new Date()}
                            onClose={() => setIsNotesOpen(false)}
                            side={notesSide}
                            onToggleSide={() => setNotesSide(prev => prev === 'left' ? 'right' : 'left')}
                            initialContent={notesContent}
                            onContentChange={setNotesContent}
                        />
                    )}
                </div>
            </div>

        </div>
    );
}
