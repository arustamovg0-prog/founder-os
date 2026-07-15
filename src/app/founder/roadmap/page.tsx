'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { ROADMAP_STAGES } from '@/lib/constants';
import { CheckCircle, Lock, Clock, AlertCircle, Upload, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Startup } from '@/types';

const PHASE_COLORS: Record<string, string> = {
  discovery: '#3F3F46', validation: '#71717A',
  building: '#FFFFFF', scaling: '#D4D4D8', fundraising: '#52525B',
};

type StageState = 'completed' | 'in_progress' | 'pending_review' | 'locked';

const STAGE_STATES: Record<string, StageState> = {
  stage_1_discovery: 'completed',
  stage_2_validation: 'completed',
  stage_3_mvp: 'completed',
  stage_4_traction: 'completed',
  stage_5_fundraising: 'in_progress',
};

const STATE_CONFIG: Record<StageState, { icon: React.ReactNode; label: string; color: string }> = {
  completed: { icon: <CheckCircle size={16} />, label: 'Completed', color: '#D4D4D8' },
  in_progress: { icon: <Clock size={16} />, label: 'In Progress', color: '#71717A' },
  pending_review: { icon: <AlertCircle size={16} />, label: 'Pending Review', color: '#A1A1AA' },
  locked: { icon: <Lock size={16} />, label: 'Locked', color: '#334155' },
};

export default function RoadmapPage() {
  const t = useTranslations('FounderRoadmap');
  const { profile } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>('stage_5_fundraising');
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedArtifacts, setUploadedArtifacts] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile?.linkedStartupId) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'startups', profile.linkedStartupId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Startup;
        setStartup(data);
        
        // Попытка восстановить состояние загруженных артефактов из Firestore
        const restored: string[] = [];
        if (data.dataRoom?.pitchDeckUrl) restored.push('pitch_deck');
        if (data.dataRoom?.financialModelUrl) restored.push('financial_model');
        if (data.dataRoom?.executiveSummaryUrl) restored.push('executive_summary');
        if (data.dataRoom?.customerDevReportUrl) restored.push('customer_dev_report');
        if (data.dataRoom?.legalDocsUrl) restored.push('legal_docs');
        setUploadedArtifacts(restored);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

  const triggerUpload = (artifactKey: string) => {
    setUploading(artifactKey);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e?: ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file || !uploading || !startup) return;

    setUploadProgress(0);
    const storageRef = ref(storage, `startup_documents/${startup.id}/${uploading}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        toast.error(t('uploadFailed') + error.message);
        setUploading(null);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Сохранение URL в Firestore
        let urlField = '';
        if (uploading === 'pitch_deck') urlField = 'dataRoom.pitchDeckUrl';
        if (uploading === 'financial_model') urlField = 'dataRoom.financialModelUrl';
        if (uploading === 'executive_summary') urlField = 'dataRoom.executiveSummaryUrl';
        if (uploading === 'customer_dev_report') urlField = 'dataRoom.customerDevReportUrl';
        if (uploading === 'legal_docs') urlField = 'dataRoom.legalDocsUrl';

        if (urlField) {
          try {
            await updateDoc(doc(db, 'startups', startup.id), {
              [urlField]: downloadURL
            });
            toast.success(`${file.name} ${t('uploadedSuccessfully')}`, { icon: '📎' });
            setUploadedArtifacts(prev => [...prev, uploading]);
          } catch (err: any) {
            toast.error(t('failedToSave') + err.message);
          }
        }
        setUploading(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    );
  };

  const completedCount = Object.values(STAGE_STATES).filter(s => s === 'completed').length;
  const totalCount = ROADMAP_STAGES.length;

  if (loading) return <div className="animate-fade-in" style={{ padding: 32, color: '#64748b' }}>{t('loading')}</div>;
  if (!startup) return <div className="animate-fade-in" style={{ padding: 32, color: '#64748b' }}>{t('notFound')}</div>;

  return (
    <div className="animate-fade-in">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
          {t('title')}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          {t('subtitle')}
        </p>
      </div>

      {/* Overall Progress */}
      <div className="card" style={{ marginBottom: '28px', background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: '#D8B4FE' }}>
              {startup.roadmapProgress || 0}%
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {completedCount} {t('of')} {totalCount} {t('stagesCompleted')}
            </div>
          </div>
          <span className="badge badge-purple">{t('investmentReadyTrack')}</span>
        </div>
        <div className="progress-bar" style={{ height: '8px' }}>
          <div className="progress-fill" style={{ width: `${startup.roadmapProgress || 0}%` }} />
        </div>
      </div>

      {/* Stages */}
      <div className="stagger-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {ROADMAP_STAGES.map((stage, idx) => {
          const state = STAGE_STATES[stage.id] || 'locked';
          const cfg = STATE_CONFIG[state];
          const phaseColor = PHASE_COLORS[stage.phase];
          const isExpanded = expanded === stage.id;
          const isActive = state === 'in_progress' || state === 'pending_review';

          return (
            <div key={stage.id} className="stagger-item" style={{
              borderRadius: '16px',
              border: `1px solid ${isActive ? 'rgba(255,255,255,0.3)' : state === 'completed' ? 'rgba(212,212,216,0.2)' : 'rgba(255,255,255,0.06)'}`,
              background: isActive ? 'rgba(255,255,255,0.05)' : state === 'locked' ? 'rgba(255,255,255,0.01)' : 'rgba(13,13,32,0.8)',
              overflow: 'hidden',
              transition: 'var(--transition-standard)',
            }}>
              {/* Stage Header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : stage.id)}
                disabled={state === 'locked'}
                style={{
                  width: '100%', padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: 'none', border: 'none', cursor: state === 'locked' ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                {/* Step number */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: state === 'completed' ? 'rgba(212,212,216,0.2)' : state === 'locked' ? 'rgba(255,255,255,0.03)' : `${phaseColor}20`,
                  border: `2px solid ${state === 'completed' ? '#D4D4D8' : state === 'locked' ? 'rgba(255,255,255,0.08)' : phaseColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15,
                  color: state === 'completed' ? '#D4D4D8' : state === 'locked' ? '#334155' : phaseColor,
                }}>
                  {state === 'completed' ? '✓' : idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: state === 'locked' ? '#334155' : '#f8fafc' }}>
                      {t(`stages.${stage.id}.title`)}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '99px', fontSize: 10, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: `${phaseColor}15`, color: phaseColor,
                      border: `1px solid ${phaseColor}25`,
                    }}>
                      {stage.phase}
                    </span>
                    {stage.isGatekeeper && (
                      <span className="badge badge-yellow">{t('gatekeeper')}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#475569' }}>{t(`stages.${stage.id}.description`)}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: cfg.color }}>
                    {cfg.icon}
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {state === 'in_progress' ? t('inProgress') : state === 'pending_review' ? t('pendingReview') : t(state as any)}
                    </span>
                  </div>
                  {state !== 'locked' && (
                    isExpanded ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && state !== 'locked' && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ paddingTop: '20px' }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                      {t('requiredArtifacts')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {stage.requiredArtifacts.map((art) => {
                        const isDone = state === 'completed' || uploadedArtifacts.includes(art.key);
                        return (
                          <div key={art.key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', borderRadius: '10px',
                            background: isDone ? 'rgba(212,212,216,0.07)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isDone ? 'rgba(212,212,216,0.2)' : 'rgba(255,255,255,0.06)'}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {isDone
                                ? <CheckCircle size={14} color="#D4D4D8" />
                                : <Upload size={14} color="#64748b" />
                              }
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: isDone ? '#A1A1AA' : '#94a3b8' }}>
                                  {t(`stages.${stage.id}.artifacts.${art.key}`)}
                                </div>
                                <div style={{ fontSize: 11, color: '#334155' }}>{t('type')} {art.type} • {art.isRequired ? t('required') : t('optional')}</div>
                              </div>
                            </div>
                            {!isDone && (
                              <button
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: '6px 14px' }}
                                onClick={() => triggerUpload(art.key)}
                                disabled={uploading === art.key}
                              >
                                {uploading === art.key ? (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                                    {Math.round(uploadProgress)}%
                                  </span>
                                ) : (
                                  <><Upload size={12} /> {t('upload')}</>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {stage.unlockConditions.adminVerificationRequired && (
                      <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(161,161,170,0.08)', border: '1px solid rgba(161,161,170,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Zap size={14} color="#60a5fa" />
                          <span style={{ fontSize: 13, color: '#60a5fa' }}>
                            {t('verificationRequired', { team: 'UNTITLED' })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
