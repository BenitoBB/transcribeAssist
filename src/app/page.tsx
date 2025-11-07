'use client';

import Link from 'next/link';
import { AccessibleButton } from '@/components/ui/AccessibleButton';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          Selecciona tu Rol
        </h1>
        <p className="mt-4 text-base leading-8 text-gray-600 sm:text-lg">
          Elige si quieres acceder como maestro o como alumno.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-x-6">
          <Link href="/teacher" passHref>
            <AccessibleButton
              size="lg"
              aria-label="Acceder a la vista de maestro"
              className="w-full sm:w-auto"
            >
              Entrar como Maestro
            </AccessibleButton>
          </Link>
          <Link href="/student" passHref>
            <AccessibleButton
              size="lg"
              variant="outline"
              aria-label="Acceder a la vista de alumno"
              className="w-full sm:w-auto"
            >
              Entrar como Alumno
            </AccessibleButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
