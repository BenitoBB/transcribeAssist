'use client';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';
import { Users, GraduationCap } from 'lucide-react';

export function RoleSelector() {
  const { setRole } = useApp();

  return (
    <div className="flex items-center justify-center h-full p-4 -mt-16">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Bienvenido a TranscrineAssist</h2>
        <p className="text-gray-600 mb-8">
          Por favor, selecciona tu rol para comenzar.
        </p>
        <div className="flex justify-center gap-6">
          <Button
            onClick={() => setRole('teacher')}
            className="h-32 w-48 flex flex-col gap-2 text-lg bg-blue-600 hover:bg-blue-700"
          >
            <GraduationCap className="h-10 w-10" />
            <span>Maestro</span>
          </Button>
          <Button
            onClick={() => setRole('student')}
            className="h-32 w-48 flex flex-col gap-2 text-lg bg-green-600 hover:bg-green-700"
          >
            <Users className="h-10 w-10" />
            <span>Estudiante</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
