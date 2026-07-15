'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, BarChart2, Users, Shield, CheckCircle, Eye, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, isDemoConfig, auth, storage } from '@/lib/firebase';
import { Startup } from '@/types';


interface DocItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  url: string | null;
  uploadedAt?: string;
  aiScore?: number | null;
  description: string;
}

export default function DataRoomPage() {
  const t = useTranslations('FounderDataRoom');
  const { profile } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  
  const [docs, setDocs] = useState<DocItem[]>([
    { key: 'pitch_deck', label: 'Pitch Deck', icon: <FileText size={20} />, color: '#7c3aed', url: null, description: 'Company overview, market opportunity, and investment thesis' },
    { key: 'financial_model', label: 'Financial Model', icon: <BarChart2 size={20} />, color: '#10b981', url: null, description: '3-year financial projections and unit economics' },
    { key: 'executive_summary', label: 'Executive Summary', icon: <FileText size={20} />, color: '#3b82f6', url: null, description: '2-page summary of business and investment opportunity' },
    { key: 'customer_dev_report', label: 'Customer Dev Report', icon: <Users size={20} />, color: '#f59e0b', url: null, description: 'Customer discovery interviews and insights' },
    { key: 'legal_docs', label: 'Legal Documents', icon: <Shield size={20} />, color: '#ec4899', url: null, description: 'Articles of incorporation, cap table, agreements' },
  ]);

  useEffect(() => {
    async function loadStartup() {
      if (profile?.linkedStartupId && !isDemoConfig) {
        try {
          const snap = await getDoc(doc(db, 'startups', profile.linkedStartupId));
          if (snap.exists()) {
            const data = snap.data();
            setStartup({ id: snap.id, ...data } as Startup);
            
            setDocs(prev => prev.map(d => {
              let url = null;
              if (d.key === 'pitch_deck') url = data.dataRoom?.pitchDeckUrl;
              else if (d.key === 'financial_model') url = data.dataRoom?.financialModelUrl;
              else if (d.key === 'executive_summary') url = data.dataRoom?.executiveSummaryUrl;
              else if (d.key === 'customer_dev_report') url = data.dataRoom?.customerDevReportUrl;
              else if (d.key === 'legal_docs') url = data.dataRoom?.legalDocsUrl;

              if (url) {
                if (d.key === 'pitch_deck') {
                  return { ...d, url, aiScore: data.aiScores?.overallReadinessScore || null };
                }
                return { ...d, url };
              }
              return d;
            }));
          }
        } catch (e) {
          console.warn('Failed to fetch startup for Data Room', e);
        }
      }
    }
    loadStartup();
  }, [profile]);

  const [uploading, setUploading] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const processUpload = async (file: File | null | undefined, key: string) => {
    if (!file) return;

    setUploading(key);
    
    let downloadUrl = '#';
    try {
      if (!isDemoConfig && startup?.id) {
        const fileRef = ref(storage, `startups/${startup.id}/dataroom/${key}_${file.name}`);
        await uploadBytes(fileRef, file);
        downloadUrl = await getDownloadURL(fileRef);
        
        let urlField = '';
        if (key === 'pitch_deck') urlField = 'dataRoom.pitchDeckUrl';
        else if (key === 'financial_model') urlField = 'dataRoom.financialModelUrl';
        else if (key === 'executive_summary') urlField = 'dataRoom.executiveSummaryUrl';
        else if (key === 'customer_dev_report') urlField = 'dataRoom.customerDevReportUrl';
        else if (key === 'legal_docs') urlField = 'dataRoom.legalDocsUrl';

        if (urlField) {
          await updateDoc(doc(db, 'startups', startup.id), {
            [urlField]: downloadUrl
          });
        }
      } else {
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error('Upload failed', err);
      toast.error(t('failedToUpload'));
      setUploading(null);
      return;
    }

    let newScore = null;
    
    if (key === 'pitch_deck' && startup) {
      toast(t('analyzingPitchDeck'), { icon: '🧠' });
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ startupData: startup }),
        });
        const aiData = await res.json();
        
        if (aiData.score) {
          newScore = aiData.score;
          
          if (!isDemoConfig && startup.id) {
            await updateDoc(doc(db, 'startups', startup.id), {
              'aiScores.overallReadinessScore': newScore
            });
          }
          toast.success(t('aiScoreUpdated', { score: newScore }), { icon: '🎉' });
        }
      } catch (err) {
        console.error('AI Analysis failed', err);
        // Fallback for demo
        newScore = 85;
        toast.success(t('demoAiScoreUpdated', { score: newScore }), { icon: '🤖' });
      }
    } else {
      toast.success(t('documentUploaded'), { icon: '📎' });
    }

    setDocs(prev => prev.map(d => d.key === key ? {
      ...d, 
      url: '#', 
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      aiScore: newScore ?? d.aiScore
    } : d));
    
    setUploading(null);
  };

  const handleDelete = (key: string) => {
    setDocs(prev => prev.map(d => d.key === key ? { ...d, url: null, uploadedAt: undefined, aiScore: null } : d));
    toast.error(t('documentRemoved'), { icon: '🗑️' });
  };

  const uploaded = docs.filter(d => d.url).length;
  const total = docs.length;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{t('title')}</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>{t('subtitle')}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700, color: '#a78bfa' }}>{uploaded}/{total}</div>
          <div style={{ fontSize: 12, color: '#475569' }}>{t('documentsReady')}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{t('completeness')}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{Math.round((uploaded / total) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(uploaded / total) * 100}%` }} />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc) => (
          <div
            key={doc.key}
            className={`card glass-hover ${dragging === doc.key ? 'glow-purple' : ''}`}
            style={{
              borderColor: dragging === doc.key ? 'rgba(124,58,237,0.4)' : doc.url ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              background: doc.url ? 'rgba(13,13,32,0.8)' : 'rgba(255,255,255,0.01)',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(doc.key); }}
            onDragLeave={() => setDragging(null)}
            onDrop={(e) => { e.preventDefault(); setDragging(null); processUpload(e.dataTransfer.files[0], doc.key); }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
                background: `${doc.color}15`, border: `1px solid ${doc.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: doc.color,
              }}>
                {doc.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{t(`docs.${doc.key}.label` as any)}</span>
                  {doc.url && <CheckCircle size={13} color="#10b981" />}
                </div>
                <p style={{ fontSize: 12, color: '#475569' }}>{t(`docs.${doc.key}.description` as any)}</p>
              </div>
            </div>

            {doc.url ? (
              <div>
                {/* AI Score */}
                {doc.aiScore !== null && doc.aiScore !== undefined && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', borderRadius: '8px',
                    background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                    marginBottom: '12px',
                  }}>
                    <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>{t('aiScore')}</span>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#a78bfa', marginLeft: 'auto' }}>
                      {doc.aiScore}/100
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#334155' }}>{t('uploadedDate', { date: doc.uploadedAt })}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-secondary" style={{ fontSize: 11, padding: '5px 12px', gap: '4px' }}>
                      <Eye size={11} /> {t('view')}
                    </button>
                    <button
                      onClick={() => handleDelete(doc.key)}
                      style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                style={{
                  border: `2px dashed ${dragging === doc.key ? doc.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '10px', padding: '20px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'block',
                  background: dragging === doc.key ? `${doc.color}08` : 'transparent',
                }}
              >
                <input 
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={(e) => processUpload(e.target.files?.[0], doc.key)}
                  accept={doc.key === 'pitch_deck' ? '.pdf,.ppt,.pptx' : '.xls,.xlsx,.csv'}
                />
                {uploading === doc.key ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b' }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    {t('uploading')}
                  </div>
                ) : (
                  <>
                    <Upload size={18} style={{ marginBottom: 6, color: '#334155' }} />
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      <span style={{ color: doc.color, fontWeight: 600 }}>{t('clickToUpload')}</span> {t('orDragDrop')}
                    </div>
                  </>
                )}
              </label>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
