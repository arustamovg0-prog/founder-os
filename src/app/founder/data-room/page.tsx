'use client';

import { useState } from 'react';
import { Upload, FileText, BarChart2, Users, Shield, CheckCircle, Eye, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { MOCK_STARTUPS } from '@/lib/mockData';

const MY_STARTUP = MOCK_STARTUPS[0];

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
  const [docs, setDocs] = useState<DocItem[]>([
    { key: 'pitch_deck', label: 'Pitch Deck', icon: <FileText size={20} />, color: '#7c3aed', url: MY_STARTUP.dataRoom.pitchDeckUrl, uploadedAt: '08 May 2026', aiScore: 82, description: 'Company overview, market opportunity, and investment thesis' },
    { key: 'financial_model', label: 'Financial Model', icon: <BarChart2 size={20} />, color: '#10b981', url: MY_STARTUP.dataRoom.financialModelUrl, uploadedAt: '05 May 2026', aiScore: 78, description: '3-year financial projections and unit economics' },
    { key: 'executive_summary', label: 'Executive Summary', icon: <FileText size={20} />, color: '#3b82f6', url: MY_STARTUP.dataRoom.executiveSummaryUrl, uploadedAt: '07 May 2026', aiScore: null, description: '2-page summary of business and investment opportunity' },
    { key: 'customer_dev_report', label: 'Customer Dev Report', icon: <Users size={20} />, color: '#f59e0b', url: MY_STARTUP.dataRoom.customerDevReportUrl, uploadedAt: '20 Apr 2026', aiScore: null, description: 'Customer discovery interviews and insights' },
    { key: 'legal_docs', label: 'Legal Documents', icon: <Shield size={20} />, color: '#ec4899', url: null, uploadedAt: undefined, aiScore: null, description: 'Articles of incorporation, cap table, agreements' },
  ]);

  const [uploading, setUploading] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const handleUpload = (key: string) => {
    setUploading(key);
    setTimeout(() => {
      setDocs(prev => prev.map(d => d.key === key ? {
        ...d, url: '#', uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      } : d));
      setUploading(null);
      toast.success('Document uploaded! AI analysis queued.', { icon: '📎' });
    }, 2000);
  };

  const handleDelete = (key: string) => {
    setDocs(prev => prev.map(d => d.key === key ? { ...d, url: null, uploadedAt: undefined, aiScore: null } : d));
    toast.error('Document removed', { icon: '🗑️' });
  };

  const uploaded = docs.filter(d => d.url).length;
  const total = docs.length;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Data Room</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Secure document storage for investor due diligence</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700, color: '#a78bfa' }}>{uploaded}/{total}</div>
          <div style={{ fontSize: 12, color: '#475569' }}>Documents ready</div>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Data Room Completeness</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{Math.round((uploaded / total) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(uploaded / total) * 100}%` }} />
        </div>
      </div>

      {/* Documents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
            onDrop={(e) => { e.preventDefault(); setDragging(null); handleUpload(doc.key); }}
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
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{doc.label}</span>
                  {doc.url && <CheckCircle size={13} color="#10b981" />}
                </div>
                <p style={{ fontSize: 12, color: '#475569' }}>{doc.description}</p>
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
                    <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>🤖 AI Score</span>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#a78bfa', marginLeft: 'auto' }}>
                      {doc.aiScore}/100
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#334155' }}>Uploaded {doc.uploadedAt}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-secondary" style={{ fontSize: 11, padding: '5px 12px', gap: '4px' }}>
                      <Eye size={11} /> View
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
              <div
                style={{
                  border: `2px dashed ${dragging === doc.key ? doc.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '10px', padding: '20px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: dragging === doc.key ? `${doc.color}08` : 'transparent',
                }}
                onClick={() => handleUpload(doc.key)}
              >
                {uploading === doc.key ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b' }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    Uploading...
                  </div>
                ) : (
                  <>
                    <Upload size={18} style={{ marginBottom: 6, color: '#334155' }} />
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      <span style={{ color: doc.color, fontWeight: 600 }}>Click to upload</span> or drag & drop
                    </div>
                  </>
                )}
              </div>
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
