import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/theme-provider';

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://founder-os--founder-os-78cfc.us-east4.hosted.app'),
  title: 'Founder OS — Turn Chaos Into System',
  description: 'AI-powered startup CRM and ecosystem management platform by UNTITLED. Track startup journeys, connect founders with investors, and automate your deal flow.',
  keywords: 'startup, CRM, investor, founder, AI, ecosystem, UNTITLED',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Founder OS',
  },
  openGraph: {
    title: 'Founder OS — Turn Chaos Into System',
    description: 'AI-powered startup ecosystem platform by UNTITLED',
    type: 'website',
    siteName: 'Founder OS',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <div className="mesh-bg" />
              <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
              </div>
              <Toaster position="bottom-right" />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
