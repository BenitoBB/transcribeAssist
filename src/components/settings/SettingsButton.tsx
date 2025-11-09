'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StyleSettingsModal } from './StyleSettingsModal';

export function SettingsButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Abrir ajustes de visualización</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustes de Visualización</DialogTitle>
        </DialogHeader>
        <StyleSettingsModal />
      </DialogContent>
    </Dialog>
  );
}
