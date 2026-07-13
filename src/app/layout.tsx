import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
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
  title: "CallBlick",
  description: "Advanced intelligence for conversation analysis",
  openGraph: {
    title: "CallBlick",
    description: "Advanced intelligence for conversation analysis",
    url: "https://app.callblick.com",
    siteName: "CallBlick",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "CallBlick" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CallBlick",
    description: "Advanced intelligence for conversation analysis",
    images: ["/opengraph-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      translate="no"
    >
      <head>
        <meta name="google" content="notranslate" />
        {/* Apply theme class before first paint to prevent dark flash */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();` }} />
      </head>
      <body className="h-screen overflow-hidden flex relative" style={{ background: 'var(--water-deep, #060E1A)', color: 'var(--text-primary, #F2F6FF)' }}>
        <ClerkProvider dynamic>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
