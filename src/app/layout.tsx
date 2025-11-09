'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TranscriptionProvider } from '@/context/TranscriptionContext';
import { StyleProvider, useStyle } from '@/context/StyleContext';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({ subsets: ['latin'] });

// We need a sub-component to access the useStyle hook
function ThemedLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useStyle();

  return (
    <html lang="en" className={theme}>
      <head>
        {/* Metadata can be managed here if needed, but we keep it static for now */}
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
