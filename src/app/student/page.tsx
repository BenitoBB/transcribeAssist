import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function StudentPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 relative p-4">
      <Link href="/" className="absolute top-8 left-8">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <h1 className="text-3xl font-bold">Vista del Alumno</h1>
      <p className="text-gray-600 mt-2">
        Aquí se mostrará el contenido para el alumno.
      </p>
    </div>
  );
}
