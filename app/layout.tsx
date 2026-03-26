import type { Metadata, Viewport } from 'next';
import { Public_Sans, Work_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-label',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Operações no Café - Visão Geral',
  description: 'Painel avançado de rastreamento de operações de campo e gestão agrícola.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Operações no Café',
  },
};

export const viewport: Viewport = {
  themeColor: '#90d792',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${publicSans.variable} ${workSans.variable} dark overflow-x-hidden`}>
      <body suppressHydrationWarning className="bg-background text-on-background min-h-screen overflow-x-hidden">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
