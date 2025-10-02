import type { FC } from 'react';

const Logo = () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary-foreground bg-primary rounded-lg p-1"
    >
      <path
        d="M12 2C9.243 2 7 4.243 7 7v5.5c0 2.485 2.015 4.5 4.5 4.5h1c2.485 0 4.5-2.015 4.5-4.5V7c0-2.757-2.243-5-5-5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 10v1.5c0 3.866-3.134 7-7 7s-7-3.134-7-7V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="19"
        x2="12"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );


export const Header: FC = () => {
  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="font-headline text-2xl font-bold text-foreground">
            TranscribeAssist
          </h1>
        </div>
      </div>
    </header>
  );
};
