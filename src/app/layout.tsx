import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Kumbh_Sans } from 'next/font/google';
import "../styles/globals.css";

// const inter = Inter({ subsets: ["latin"] });
const kumbhSans = Kumbh_Sans({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Brand Health Assessment',
  description: 'Analyze and assess brand health metrics',
  icons: {
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png' },
    ],
    other: [
      { url: '/favico/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favico/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={kumbhSans.className}>
      <body>{children}</body>
    </html>
  );
}
