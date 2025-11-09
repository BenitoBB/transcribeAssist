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
        <Button variant="outline" size="icon" className="rounded-full h-12 w-12 shadow-lg">
          <Settings className="h-6 w-6" />
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
