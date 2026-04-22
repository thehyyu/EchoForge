import type { Metadata } from "next";
import { Noto_Serif_TC, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import NavRss from "./NavRss";
import NavLang from "./NavLang";
import NavSearch from "./NavSearch";
import NavProjects from "./NavProjects";
import "./globals.css";

const notoSerifTC = Noto_Serif_TC({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-serif-tc",
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
      className={`${notoSerifTC.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-3NEHHM1057" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-3NEHHM1057');
        `}</Script>
      <body className="min-h-full flex flex-col">
        <nav className="border-b border-stone-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-gray-800 hover:opacity-70">
            thehyyu
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-400">
            <NavProjects />
            <NavSearch />
            <NavLang />
            <NavRss />
          </div>
        </nav>
        <div className="flex-1">{children}</div>
        <footer className="mt-24 border-t border-stone-200 px-4 sm:px-6 py-10 text-xs text-stone-400 space-y-2">
          <div className="font-semibold text-stone-500">Hubert &middot; <span lang="en">thehyyu</span></div>
          <p>
            <a href="https://github.com/thehyyu/EchoForge" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 underline underline-offset-2">Site text and code</a>
            {' '}are{' '}
            <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 underline underline-offset-2">CC0 1.0 Universal</a>
            {' '}&mdash;{' '}
            <span className="whitespace-nowrap">no rights reserved.</span>
          </p>
        </footer>
      </body>
    </html>
  );
}
