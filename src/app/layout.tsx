'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TranscriptionProvider } from '@/context/TranscriptionContext';
import { StyleProvider, useStyle } from '@/context/StyleContext';
import { SettingsButton } from '@/components/settings/SettingsButton';

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
        <div className="absolute bottom-4 right-4 z-50">
          <SettingsButton />
        </div>
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
        <ThemedLayout>{children}</ThemedLayout>
      </TranscriptionProvider>
    </StyleProvider>
  );
}
