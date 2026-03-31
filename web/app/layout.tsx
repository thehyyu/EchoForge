import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "thehyyu's blog",
  description: "聲音、想法、文字",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-gray-800 hover:opacity-70">
            thehyyu
          </Link>
          <Link href="/search" className="text-sm text-gray-400 hover:text-gray-700">
            搜尋
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
