import MainView from '@/components/transcription/main-view';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">TranscrineAssist</h1>
        <p className="text-sm">Transcripción Inclusiva para la Educación Superior</p>
      </header>
      <main className="flex-1 p-4">
        <MainView />
      </main>
    </div>
  );
}
