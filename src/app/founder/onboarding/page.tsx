'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startupsCol } from '@/lib/db';
import { toast } from 'sonner';
import { Rocket, ArrowRight } from 'lucide-react';


export default function OnboardingPage() {
  const { profile } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [industry, setIndustry] = useState('FinTech');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    
    try {
      const startupId = crypto.randomUUID();
      
      const newStartup = {
        name,
        oneLiner,
        industry,
        stage: 'idea',
        location: '',
        website: '',
        logo: '',
        foundedDate: new Date().toISOString(),
        teamSize: 1,
        metrics: { mrr: 0, users: 0, growthPct: 0 },
        fundraising: { raising: false, targetAmount: 0, raisedAmount: 0, valuation: 0 },
        founderIds: [profile.uid], // Add founderIds for Firestore rules
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // 1. Create Startup
      await setDoc(doc(startupsCol, startupId), newStartup);
      
      // 2. Link startup to founder
      await updateDoc(doc(db, 'users', profile.uid), {
        linkedStartupId: startupId
      });
      
      toast.success('Стартап успешно создан!');
      // Hard reload or router push to refresh context
      window.location.href = '/founder';
    } catch (error: unknown) {
      toast.error((error as any).message || 'Ошибка при создании стартапа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#D8B4FE',
          }}>
            <Rocket size={28} />
          </div>
        </div>
        
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          Создайте свой Стартап
        </h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: 14, marginBottom: 32 }}>
          Заполните базовую информацию, чтобы получить доступ к Founder OS.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>Название стартапа</label>
            <input 
              className="input-field" 
              placeholder="Например, Stripe" 
              required
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>Краткое описание (One-liner)</label>
            <input 
              className="input-field" 
              placeholder="Платежная инфраструктура для интернета" 
              required
              value={oneLiner} 
              onChange={e => setOneLiner(e.target.value)} 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>Индустрия</label>
            <select 
              className="input-field" 
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              style={{ appearance: 'none' }}
            >
              <option value="FinTech">FinTech</option>
              <option value="EdTech">EdTech</option>
              <option value="HealthTech">HealthTech</option>
              <option value="SaaS">SaaS (B2B)</option>
              <option value="AI">AI & Machine Learning</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Web3">Web3 / Crypto</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 16, padding: '14px' }}>
            {loading ? 'Создание...' : <><Rocket size={18} /> Запустить <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
