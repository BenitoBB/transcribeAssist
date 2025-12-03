'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SummaryDialogProps {
  summary: string;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SummaryDialog({
  summary,
  isLoading,
  open,
  onOpenChange,
}: SummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Resumen de la Clase</DialogTitle>
          <DialogDescription>
            Este es un resumen de la transcripción generado por IA.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <LoaderCircle className="h-8 w-8 animate-spin mb-4" />
              <p>Generando resumen, por favor espera...</p>
            </div>
          )}
          {!isLoading && summary && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: summary.replace(/\n/g, '<br />'),
              }}
            />
          )}
          {!isLoading && !summary && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>El resumen aparecerá aquí.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
