'use client';

import { RoleSelector } from '@/components/role-selector';
import { TeacherView } from '@/components/teacher-view';
import { StudentView } from '@/components/student-view';
import { useApp } from '@/context/app-context';

export default function Home() {
  const { role } = useApp();

  return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">TranscrineAssist</h1>
            <p className="text-sm text-gray-500">
              Transcripción Inclusiva para la Educación Superior
            </p>
          </div>
        </header>
        <main className="flex-1">
          {!role && <RoleSelector />}
          {role === 'teacher' && <TeacherView />}
          {role === 'student' && <StudentView />}
        </main>
      </div>
  );
}
