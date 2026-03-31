import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavRss from "./NavRss";
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
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed/zh.xml', title: 'thehyyu（中文）' },
        { url: '/feed/en.xml', title: 'thehyyu (English)' },
      ],
    },
  },
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
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/search" className="hover:text-gray-700">搜尋</Link>
            <NavRss />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
