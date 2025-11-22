'use client';

import { useStyle } from '@/context/StyleContext';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTranscription } from '@/hooks/use-transcription';
import { TranscriptionModel } from '@/context/TranscriptionContext';

export function StyleSettingsModal() {
  const { style, setStyle, theme, setTheme } = useStyle();
  const { isRecording } = useTranscription();

  return (
    <div className="grid gap-6 py-4">
       <div className="grid gap-2">
        <Label htmlFor="transcription-model">Modelo de Transcripción</Label>
        <Select
          defaultValue="web-speech-api"
          disabled={isRecording}
        >
          <SelectTrigger id="transcription-model">
            <SelectValue placeholder="Seleccionar modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="web-speech-api">Navegador (Gratis, Rápido)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
            {isRecording 
                ? "No se puede cambiar el modelo mientras se graba."
                : "Actualmente solo está disponible el modelo del navegador."
            }
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="font-size">Tamaño de Fuente: {style.fontSize}px</Label>
        <Slider
          id="font-size"
          min={12}
          max={32}
          step={1}
          value={[style.fontSize]}
          onValueChange={(value) => setStyle({ ...style, fontSize: value[0] })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="line-height">Altura de Línea: {style.lineHeight}</Label>
        <Slider
          id="line-height"
          min={1.2}
          max={2.5}
          step={0.1}
          value={[style.lineHeight]}
          onValueChange={(value) => setStyle({ ...style, lineHeight: value[0] })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="letter-spacing">Espaciado de Letras: {style.letterSpacing}px</Label>
        <Slider
          id="letter-spacing"
          min={0}
          max={5}
          step={0.5}
          value={[style.letterSpacing]}
          onValueChange={(value) => setStyle({ ...style, letterSpacing: value[0] })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="font-family">Tipografía</Label>
        <Select
          value={style.fontFamily}
          onValueChange={(value) => setStyle({ ...style, fontFamily: value })}
        >
          <SelectTrigger id="font-family">
            <SelectValue placeholder="Seleccionar fuente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Inter, sans-serif">Inter (Defecto)</SelectItem>
            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
            <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
            <SelectItem value="'Open Dyslexic', sans-serif">Open Dyslexic</SelectItem>
          </SelectContent>
        </Select>
      </div>
       <div className="grid gap-2">
        <Label>Tema de Color</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Claro</Button>
          <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Oscuro</Button>
          <Button variant={theme === 'protanopia' ? 'default' : 'outline'} onClick={() => setTheme('protanopia')}>Protanopia</Button>
          <Button variant={theme === 'deuteranopia' ? 'default' : 'outline'} onClick={() => setTheme('deuteranopia')}>Deuteranopia</Button>
          <Button variant={theme === 'tritanopia' ? 'default' : 'outline'} onClick={() => setTheme('tritanopia')}>Tritanopia</Button>
          <Button variant={theme === 'accessible' ? 'default' : 'outline'} onClick={() => setTheme('accessible')}>Alto Contraste</Button>
        </div>
      </div>
    </div>
  );
}
