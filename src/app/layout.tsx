import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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
  title: "Conversation Intel",
  description: "Advanced intelligence for conversation analysis",
};

import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-screen overflow-hidden flex text-foreground bg-background">
        <NextIntlClientProvider messages={messages}>
          <Sidebar aria-hidden="true" />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 subtle-grid">
              {children}
            </main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
