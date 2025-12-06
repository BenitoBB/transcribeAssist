'use client';

import { TranscriptionProvider } from '@/context/TranscriptionContext';
import { RecordingSection } from '@/components/RecordingSection';

export default function Home() {
  return (
    <TranscriptionProvider>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎓 TranscribeAssist
            </h1>
            <p className="text-lg text-gray-600">
              Sistema inteligente de transcripción y análisis de clases
            </p>
          </header>

          <RecordingSection />
        </div>
      </main>
    </TranscriptionProvider>
  );
}