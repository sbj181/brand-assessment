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
  title: "Brand Assessment Tool",
  description: "Created by @sbj181",
};

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
