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
import { cn } from '@/lib/utils';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { Card, CardContent } from '@/components/ui/card';

const PHASE_COLORS: Record<string, string> = {
  discovery: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  validation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50',
  building: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
  scaling: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
  fundraising: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50',
};

type StageState = 'completed' | 'in_progress' | 'pending_review' | 'locked';

const STAGE_STATES: Record<string, StageState> = {
  stage_1_discovery: 'completed',
  stage_2_validation: 'completed',
  stage_3_mvp: 'completed',
  stage_4_traction: 'completed',
  stage_5_fundraising: 'in_progress',
};

const STATE_CONFIG: Record<StageState, { icon: React.ReactNode; label: string; colorClass: string }> = {
  completed: { icon: <CheckCircle size={16} />, label: 'Completed', colorClass: 'text-green-600 dark:text-green-400' },
  in_progress: { icon: <Clock size={16} />, label: 'In Progress', colorClass: 'text-amber-600 dark:text-amber-400' },
  pending_review: { icon: <AlertCircle size={16} />, label: 'Pending Review', colorClass: 'text-purple-600 dark:text-purple-400' },
  locked: { icon: <Lock size={16} />, label: 'Locked', colorClass: 'text-zinc-400 dark:text-zinc-500' },
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

  if (loading) return <div className="p-8 text-zinc-500 animate-pulse">{t('loading')}</div>;
  if (!startup) return <div className="p-8 text-zinc-500">{t('notFound')}</div>;

  return (
    <FadeIn className="space-y-8">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display text-3xl font-bold text-purple-600 dark:text-purple-400">
                {startup.roadmapProgress || 0}%
              </div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {completedCount} {t('of')} {totalCount} {t('stagesCompleted')}
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider">
              {t('investmentReadyTrack')}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div 
              className="h-full rounded-full bg-purple-500 dark:bg-purple-400 transition-all duration-1000" 
              style={{ width: `${startup.roadmapProgress || 0}%` }} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Stages */}
      <StaggerContainer className="flex flex-col gap-4">
        {ROADMAP_STAGES.map((stage, idx) => {
          const state = STAGE_STATES[stage.id] || 'locked';
          const cfg = STATE_CONFIG[state];
          const phaseClasses = PHASE_COLORS[stage.phase] || PHASE_COLORS.discovery;
          const isExpanded = expanded === stage.id;
          const isActive = state === 'in_progress' || state === 'pending_review';

          return (
            <StaggerItem key={stage.id} className={cn(
              "rounded-2xl border overflow-hidden transition-all duration-300",
              isActive ? "border-zinc-300 dark:border-zinc-700 bg-transparent shadow-sm" : 
              state === 'completed' ? "border-zinc-200 dark:border-zinc-800 bg-transparent" : 
              "border-zinc-100 dark:border-zinc-800/50 bg-transparent"
            )}>
              {/* Stage Header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : stage.id)}
                disabled={state === 'locked'}
                className={cn(
                  "w-full p-5 sm:p-6 flex items-center gap-4 text-left transition-colors",
                  state === 'locked' ? "cursor-not-allowed opacity-75" : "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                {/* Step number */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-display font-bold text-sm",
                  state === 'completed' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50" : 
                  state === 'locked' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700" : 
                  phaseClasses
                )}>
                  {state === 'completed' ? '✓' : idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={cn(
                      "font-display text-base font-bold",
                      state === 'locked' ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-white"
                    )}>
                      {t(`stages.${stage.id}.title`)}
                    </span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      phaseClasses
                    )}>
                      {stage.phase}
                    </span>
                    {stage.isGatekeeper && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                        {t('gatekeeper')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 sm:line-clamp-none">{t(`stages.${stage.id}.description`)}</p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <div className={cn("hidden sm:flex items-center gap-1.5", cfg.colorClass)}>
                    {cfg.icon}
                    <span className="text-xs font-bold">
                      {state === 'in_progress' ? t('inProgress') : state === 'pending_review' ? t('pendingReview') : t(state as any)}
                    </span>
                  </div>
                  {state !== 'locked' && (
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && state !== 'locked' && (
                <div className="px-5 sm:px-6 pb-6 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="pt-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                      {t('requiredArtifacts')}
                    </div>
                    <div className="flex flex-col gap-3">
                      {stage.requiredArtifacts.map((art) => {
                        const isDone = state === 'completed' || uploadedArtifacts.includes(art.key);
                        return (
                          <div key={art.key} className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-colors",
                            isDone ? "bg-transparent border-zinc-200 dark:border-zinc-800" : "bg-transparent border-zinc-200 dark:border-zinc-700"
                          )}>
                            <div className="flex items-center gap-3">
                              {isDone
                                ? <CheckCircle size={16} className="text-green-500 dark:text-green-400 shrink-0" />
                                : <Upload size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                              }
                              <div>
                                <div className={cn("text-sm font-bold", isDone ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-900 dark:text-white")}>
                                  {t(`stages.${stage.id}.artifacts.${art.key}`)}
                                </div>
                                <div className="text-xs font-medium text-zinc-500 mt-0.5">
                                  {t('type')} {art.type} • {art.isRequired ? <span className="text-amber-600 dark:text-amber-500 font-bold">{t('required')}</span> : t('optional')}
                                </div>
                              </div>
                            </div>
                            {!isDone && (
                              <button
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-zinc-900 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                onClick={() => triggerUpload(art.key)}
                                disabled={uploading === art.key}
                              >
                                {uploading === art.key ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-zinc-300 dark:border-zinc-500 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                                    {Math.round(uploadProgress)}%
                                  </>
                                ) : (
                                  <><Upload size={14} /> {t('upload')}</>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {stage.unlockConditions.adminVerificationRequired && (
                      <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                          <Zap size={14} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          {t('verificationRequired', { team: 'UNTITLED' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </FadeIn>
  );
}
