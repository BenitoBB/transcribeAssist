'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface SummaryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  summary: string;
  isLoading: boolean;
}

export function SummaryDialog({
  isOpen,
  onOpenChange,
  summary,
  isLoading,
}: SummaryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Resumen de la Transcripción</DialogTitle>
          <DialogDescription>
            Este es un resumen generado de los puntos clave de la clase.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full w-full rounded-md border p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Generando resumen...</p>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {summary || 'No hay resumen disponible.'}
              </p>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
