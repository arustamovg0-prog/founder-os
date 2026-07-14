import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Founder OS — Turn Chaos Into System',
  description: 'AI-powered startup CRM and ecosystem management platform by UNTITLED. Track startup journeys, connect founders with investors, and automate your deal flow.',
  keywords: 'startup, CRM, investor, founder, AI, ecosystem, UNTITLED',
  manifest: '/manifest.json',
  themeColor: '#9333EA',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <div className="mesh-bg" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0d0d20',
                color: '#f8fafc',
                border: '1px solid rgba(147,51,234,0.3)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
