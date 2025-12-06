'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SettingsButton } from '@/components/settings/SettingsButton';

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <SettingsButton />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Selecciona tu Rol
        </h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
          Elige si quieres acceder como maestro o como alumno.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-x-6">
          <Link href="/teacher" passHref>
            <Button
              size="lg"
              aria-label="Acceder a la vista de maestro"
              className="w-full sm:w-auto text-lg h-12 px-10"
            >
              Entrar como Maestro
            </Button>
          </Link>
          <Link href="/student" passHref>
            <Button
              size="lg"
              variant="outline"
              aria-label="Acceder a la vista de alumno"
              className="w-full sm:w-auto text-lg h-12 px-10"
            >
              Entrar como Alumno
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}