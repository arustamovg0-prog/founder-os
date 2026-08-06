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
import { cn } from '@/lib/utils';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { Card, CardContent } from '@/components/ui/card';

interface DocItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  colorClasses: { text: string; bg: string; border: string; activeBorder: string; hoverBg: string };
  url: string | null;
  uploadedAt?: string;
  aiScore?: number | null;
  description: string;
}

export default function DataRoomPage() {
  const t = useTranslations('FounderDataRoom');
  const { profile, isDemoMode } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  
  const [docs, setDocs] = useState<DocItem[]>([
    { 
      key: 'pitch_deck', label: 'Pitch Deck', icon: <FileText size={20} />, 
      colorClasses: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-900/50', activeBorder: 'border-purple-400 dark:border-purple-500', hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/10' }, 
      url: null, description: 'Company overview, market opportunity, and investment thesis' 
    },
    { 
      key: 'financial_model', label: 'Financial Model', icon: <BarChart2 size={20} />, 
      colorClasses: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-900/50', activeBorder: 'border-emerald-400 dark:border-emerald-500', hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10' }, 
      url: null, description: '3-year financial projections and unit economics' 
    },
    { 
      key: 'executive_summary', label: 'Executive Summary', icon: <FileText size={20} />, 
      colorClasses: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-900/50', activeBorder: 'border-blue-400 dark:border-blue-500', hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/10' }, 
      url: null, description: '2-page summary of business and investment opportunity' 
    },
    { 
      key: 'customer_dev_report', label: 'Customer Dev Report', icon: <Users size={20} />, 
      colorClasses: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-900/50', activeBorder: 'border-amber-400 dark:border-amber-500', hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/10' }, 
      url: null, description: 'Customer discovery interviews and insights' 
    },
    { 
      key: 'legal_docs', label: 'Legal Documents', icon: <Shield size={20} />, 
      colorClasses: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-200 dark:border-pink-900/50', activeBorder: 'border-pink-400 dark:border-pink-500', hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-900/10' }, 
      url: null, description: 'Articles of incorporation, cap table, agreements' 
    },
  ]);

  useEffect(() => {
    async function loadStartup() {
      if (isDemoMode) {
        setStartup({
          id: 'demo_startup',
          name: 'Nexus AI',
          tagline: 'AI-driven operations',
          dataRoom: {
            pitchDeckUrl: 'https://example.com/pitch.pdf',
          },
          aiScores: { overallReadinessScore: 85 }
        } as Startup);
        
        setDocs(prev => prev.map(d => {
          if (d.key === 'pitch_deck') {
            return { ...d, url: 'https://example.com/pitch.pdf', aiScore: 85, uploadedAt: new Date().toLocaleDateString('en-GB') };
          }
          return d;
        }));
        return;
      }

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
  }, [profile, isDemoMode]);

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
    toast.error(t('documentRemoved'));
  };

  const uploaded = docs.filter(d => d.url).length;
  const total = docs.length;

  return (
    <FadeIn className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('subtitle')}</p>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-bold text-purple-600 dark:text-purple-400">{uploaded}/{total}</div>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('documentsReady')}</div>
        </div>
      </div>

      {/* Progress */}
      <Card className="border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-900/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t('completeness')}</span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{Math.round((uploaded / total) * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div 
              className="h-full rounded-full bg-purple-500 dark:bg-purple-400 transition-all duration-1000" 
              style={{ width: `${(uploaded / total) * 100}%` }} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {docs.map((doc) => (
          <StaggerItem
            key={doc.key}
            className={cn(
              "rounded-2xl border transition-all duration-300",
              dragging === doc.key ? "border-purple-500 shadow-md scale-[1.02] bg-purple-50/50 dark:bg-purple-900/20" : 
              doc.url ? "border-zinc-200 dark:border-zinc-800 bg-transparent" : 
              "border-zinc-100 dark:border-zinc-800/50 bg-transparent"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(doc.key); }}
            onDragLeave={() => setDragging(null)}
            onDrop={(e) => { e.preventDefault(); setDragging(null); processUpload(e.dataTransfer.files?.[0], doc.key); }}
          >
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                  doc.colorClasses.bg, doc.colorClasses.text, doc.colorClasses.border
                )}>
                  {doc.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-zinc-900 dark:text-white">{t(`docs.${doc.key}.label` as any)}</span>
                    {doc.url && <CheckCircle size={16} className="text-green-500 dark:text-green-400" />}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t(`docs.${doc.key}.description` as any)}</p>
                </div>
              </div>

              {doc.url ? (
                <div>
                  {/* AI Score */}
                  {doc.aiScore !== null && doc.aiScore !== undefined && (
                    <div className="flex items-center justify-between p-3 mb-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/50">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">{t('aiScore')}</span>
                      <span className="font-display text-lg font-bold text-purple-700 dark:text-purple-400">
                        {doc.aiScore}/100
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('uploadedDate', { date: doc.uploadedAt || '' })}</span>
                    <div className="flex gap-2">
                      <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                        <Eye size={14} /> {t('view')}
                      </button>
                      <button
                        onClick={() => handleDelete(doc.key)}
                        className="inline-flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-900/30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  className={cn(
                    "block w-full rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all",
                    dragging === doc.key ? cn(doc.colorClasses.activeBorder, doc.colorClasses.hoverBg) : 
                    "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  )}
                >
                  <input 
                    type="file" 
                    className="hidden"
                    onChange={(e) => processUpload(e.target.files?.[0], doc.key)}
                    accept={doc.key === 'pitch_deck' ? '.pdf,.ppt,.pptx' : '.xls,.xlsx,.csv'}
                  />
                  {uploading === doc.key ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
                      <span className={cn(
                        "w-6 h-6 border-2 border-t-transparent rounded-full animate-spin",
                        doc.colorClasses.text
                      )} />
                      <span className="text-sm font-medium">{t('uploading')}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Upload size={24} className={cn("mb-2 transition-colors", dragging === doc.key ? doc.colorClasses.text : "text-zinc-400 dark:text-zinc-500")} />
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        <span className={cn("font-bold", doc.colorClasses.text)}>{t('clickToUpload')}</span> {t('orDragDrop')}
                      </div>
                    </div>
                  )}
                </label>
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeIn>
  );
}
