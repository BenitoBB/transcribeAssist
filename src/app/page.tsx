'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Selecciona tu Rol
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Elige si quieres acceder como maestro o como alumno.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/teacher">
            <Button size="lg">Entrar como Maestro</Button>
          </Link>
          <Link href="/student">
            <Button size="lg" variant="outline">
              Entrar como Alumno
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
