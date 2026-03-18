'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DEFAULT_TRANSCRIPTION_TEXT } from '@/features/transcription/context/TranscriptionContext';

interface ExitConfirmationProps {
    /** El texto actual de la transcripción */
    transcriptionText?: string;
    /** El contenido actual de las notas */
    notesContent?: string;
    /** Flag adicional de progreso (ej. conexión activa) */
    hasOtherProgress?: boolean;
    /** Callback personalizado al confirmar salida */
    onConfirmExit?: () => void;
    title?: string;
    description?: string;
    tooltipText?: string;
}

/**
 * Componente unitario para manejar la salida con confirmación.
 * Solo muestra el modal si realmente hay progreso del usuario:
 * - La transcripción tiene contenido diferente al placeholder por defecto
 * - Se han tomado notas
 * - hasOtherProgress es true (ej. conexión P2P activa)
 */
export function ExitConfirmation({
    transcriptionText = '',
    notesContent = '',
    hasOtherProgress = false,
    onConfirmExit,
    title = "¿Estás seguro de que quieres salir?",
    description = "Si regresas a la página principal, se perderá el progreso de la transcripción y las notas tomadas en esta sesión.",
    tooltipText = "Volver a la página principal"
}: ExitConfirmationProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(false);

    /**
     * Determina si hay progreso real del usuario.
     * Excluye el texto placeholder inicial de la transcripción.
     */
    const checkHasRealProgress = (): boolean => {
        const hasRealTranscription = !!transcriptionText
            && transcriptionText !== DEFAULT_TRANSCRIPTION_TEXT
            && transcriptionText.trim().length > 0;

        const hasNotes = !!notesContent && notesContent.trim().length > 0;

        return hasRealTranscription || hasNotes || hasOtherProgress;
    };

    const handleBackButtonClick = () => {
        if (checkHasRealProgress()) {
            setIsOpen(true);
        } else {
            handleCompleteExit();
        }
    };

    const handleCompleteExit = () => {
        if (onConfirmExit) {
            onConfirmExit();
        } else {
            router.push('/');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBackButtonClick}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Volver</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{tooltipText}</p></TooltipContent>
            </Tooltip>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={handleCompleteExit}
                    >
                        Sí, salir y perder progreso
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
