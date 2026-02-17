'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TranscriptionProvider } from '@/context/TranscriptionContext';
import { StyleProvider, useStyle } from '@/context/StyleContext';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({ subsets: ['latin'] });

// Layout principal que envuelve toda la aplicación, proporcionando contexto de estilo, transcripción y tooltips
function ThemedLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useStyle();

  return (
    <html lang="en" className={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Open+Sans&family=Roboto&family=Open+Dyslexic&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StyleProvider>
      <TranscriptionProvider>
        <TooltipProvider>
          <ThemedLayout>{children}</ThemedLayout>
        </TooltipProvider>
      </TranscriptionProvider>
    </StyleProvider>
  );
}
