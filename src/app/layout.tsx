import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UnifrakturMaguntia } from 'next/font/google';
import { Inter } from 'next/font/google'
import Header from './components/Header';

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const medievalFont = UnifrakturMaguntia({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "The Secret Lair",
  description: "A game of dodging and blocking eye beams",
  icons: [
    {
      rel: 'icon',
      url: '/favicon.ico',
      type: 'image/x-icon',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased ${medievalFont.className} ${inter.className}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
