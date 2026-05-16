'use client';

import { useEffect, useState } from 'react';
import { MOCK_STARTUPS } from '@/lib/mockData';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MapPin, Users, Target, Rocket, Award, ExternalLink, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PublicStartupProfile({ params }: { params: { startupName: string } }) {
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const decodedName = decodeURIComponent(params.startupName);
        
        // 1. Check live Firestore
        const q = query(collection(db, 'startups'), where('name', '==', decodedName));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setStartup({ id: snap.docs[0].id, ...snap.docs[0].data() });
          setLoading(false);
          return;
        }

        // 2. Fallback to mock data for demo
        const mock = MOCK_STARTUPS.find(s => s.name.toLowerCase() === decodedName.toLowerCase());
        if (mock) {
          setStartup(mock);
        }
      } catch (err) {
        console.error('Error fetching startup:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStartup();
  }, [params.startupName]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading Profile...</div>;
  }

  if (!startup) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 48, marginBottom: 16, color: '#f8fafc' }}>404</h1>
        <p>Startup not found.</p>
        <Link href="/" className="btn-primary" style={{ marginTop: 24, textDecoration: 'none' }}>Back to Founder OS</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card glass" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative BG */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '20px', background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(59,130,246,0.2))', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontSize: 36, fontWeight: 800, color: '#a78bfa' }}>
              {startup.name.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 36, fontWeight: 800, margin: 0, color: '#f8fafc' }}>{startup.name}</h1>
              <div style={{ fontSize: 16, color: '#a78bfa', fontWeight: 600, marginTop: 4 }}>{startup.tagline || 'Building the future'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
            <span className="badge badge-purple"><Target size={12} /> {startup.industry}</span>
            <span className="badge badge-blue"><Rocket size={12} /> {startup.stage} Stage</span>
            <span className="badge badge-gray"><MapPin size={12} /> {startup.location}</span>
            <span className="badge badge-gray"><Users size={12} /> {startup.metrics?.teamSize || 1} Members</span>
            {startup.aiScores?.overallReadinessScore >= 75 && (
              <span className="badge badge-green"><Award size={12} /> Investment Ready</span>
            )}
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 18, color: '#f8fafc', marginBottom: '12px' }}>Problem</h3>
            <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: '2px solid rgba(124,58,237,0.4)' }}>
              {startup.problem || 'Not specified'}
            </p>
          </div>

          {startup.executiveSummaryAI && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 18, color: '#a78bfa', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Rocket size={18} /> AI Executive Summary
              </h3>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6 }}>
                {startup.executiveSummaryAI}
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Traction (MRR)</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 800, color: '#10b981' }}>${startup.metrics?.mrr || 0}</div>
            </div>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Users (MAU)</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{startup.metrics?.mau?.toLocaleString() || 0}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" style={{ flex: 1, padding: '14px', fontSize: 15 }}>
              <Mail size={16} /> Contact Founder
            </button>
            <button className="btn-secondary" style={{ flex: 1, padding: '14px', fontSize: 15 }}>
              <ExternalLink size={16} /> Request Pitch Deck
            </button>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: '#475569' }}>
        Verified by <strong>UNTITLED</strong> Founder OS
      </div>
    </div>
  );
}
