import { Header } from '@/components/layout/header';
import { MainView } from '@/components/transcription/main-view';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <MainView />
      </main>
    </div>
  );
}
