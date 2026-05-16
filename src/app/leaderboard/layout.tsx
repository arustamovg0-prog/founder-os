import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Startup Leaderboard — Founder OS | UNTITLED Ecosystem',
  description: 'Top-performing startups ranked by AI Readiness Score, MRR, and growth. Discover the best founders building in Central Asia with UNTITLED accelerator.',
  keywords: 'startup leaderboard, AI score, Central Asia startups, UNTITLED, FinTech, EdTech, investor',
  openGraph: {
    title: "Top UNTITLED Startup Leaderboard - Who is leading?",
    description: 'Real-time ranking of the most investment-ready startups in the UNTITLED ecosystem. Powered by Founder OS AI.',
    type: 'website',
    siteName: 'Founder OS',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Founder OS Leaderboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '🏆 UNTITLED Startup Leaderboard',
    description: 'Who is leading the UNTITLED ecosystem? Check the AI-powered startup ranking.',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
