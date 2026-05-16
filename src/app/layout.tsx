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
  openGraph: {
    title: 'Founder OS',
    description: 'Turn Chaos Into System — AI Startup Platform',
    type: 'website',
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
                border: '1px solid rgba(124,58,237,0.3)',
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
