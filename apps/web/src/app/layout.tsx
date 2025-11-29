import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'Parallel - Your AI Multiverse',
    template: '%s | Parallel',
  },
  description:
    'The ultimate AI companion app. Create AI partners, explore virtual worlds, and generate stunning content with music, video, and images.',
  keywords: [
    'AI companion',
    'AI girlfriend',
    'AI boyfriend',
    'AI chat',
    'AI music',
    'AI video',
    'virtual companion',
    'roleplay',
    'AI creator',
  ],
  authors: [{ name: 'Parallel' }],
  creator: 'Parallel',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://parallel.app',
    title: 'Parallel - Your AI Multiverse',
    description:
      'The ultimate AI companion app. Create AI partners, explore virtual worlds, and generate stunning content.',
    siteName: 'Parallel',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Parallel - Your AI Multiverse',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parallel - Your AI Multiverse',
    description: 'The ultimate AI companion app.',
    images: ['/og-image.png'],
    creator: '@parallelapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
