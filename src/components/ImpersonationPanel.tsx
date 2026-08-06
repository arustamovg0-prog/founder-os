'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup } from '@/types';
import { Eye, X, AlertTriangle, Shield, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { logImpersonationAction } from '@/app/actions/audit';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImpersonationBannerProps {
  targetName: string;
  targetRole: string;
  onExit: () => void;
}

/**
 * Баннер — показывается когда admin просматривает платформу от лица другого пользователя.
 */
export function ImpersonationBanner({ targetName, targetRole, onExit }: ImpersonationBannerProps) {
  const t = useTranslations('impersonation');
  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: 'linear-gradient(90deg, rgba(113,113,122,0.95), rgba(82,82,91,0.95))',
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Shield size={16} color="currentColor" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
          {t('adminMode')}
        </span>
        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.9)', background: 'rgba(0,0,0,0.2)', padding: '2px 10px', borderRadius: '99px' }}>
          {targetName} ({targetRole})
        </span>
        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.7)' }}>{t('actionsLogged')}</span>
      </div>
      <button
        onClick={onExit}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 16px', borderRadius: '8px',
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,0,0,0.3)',
          color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Inter',
        }}
      >
        <X size={13} /> {t('exitMode')}
      </button>
    </motion.div>
  );
}

/**
 * Кнопка и модалка для Admin Impersonation
 * Вставляется в Admin → Startups страницу
 */
export function ImpersonationPanel() {
  const t = useTranslations('impersonation');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState(false);
  const [startups, setStartups] = useState<Startup[]>([]);

  useEffect(() => {
    getDocs(query(collection(db, 'startups'), limit(4))).then(snap => {
      setStartups(snap.docs.map(d => ({ id: d.id, ...d.data() } as Startup)));
    }).catch(err => console.warn('Failed to fetch startups for impersonation', err));
  }, []);

  const [isLogging, setIsLogging] = useState(false);
  const [impersonateTarget, setImpersonateTarget] = useState<{ name: string; role: string } | null>(null);

  const startImpersonation = async (startupId: string) => {
    const startup = startups.find(s => s.id === startupId);
    if (!startup) return;

    setSelectedId(startupId);
    setIsLogging(true);
    // Логируем в неизменяемый журнал доказательств (Evidence Record)
    const auditRes = await logImpersonationAction(startup.id!, startup.name);
    setIsLogging(false);

    if (!auditRes.success) {
      toast.error(t('errorLog'));
      setSelectedId(null);
      return;
    }

    setImpersonateTarget({ name: startup.founderName || startup.name, role: 'founder' });
    setImpersonating(true);
    setSelectedId(null);

    toast.success(t('successMode', { name: startup.founderName || startup.name, hash: auditRes.hash?.substring(0, 8) || '' }));

    // В реальном сценарии: redirect на /founder с impersonation token в headers
    // Здесь — показываем баннер
  };

  const exitImpersonation = () => {
    setImpersonating(false);
    setImpersonateTarget(null);
    toast.success(t('exitSuccess'));
  };

  return (
    <>
      {/* Impersonation Banner */}
      <AnimatePresence>
        {impersonating && impersonateTarget && (
          <ImpersonationBanner
            targetName={impersonateTarget.name}
            targetRole={impersonateTarget.role}
            onExit={exitImpersonation}
          />
        )}
      </AnimatePresence>

      {/* Trigger Block */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={18} className="text-zinc-500" />
            <span className="font-display text-[15px] font-bold text-zinc-900 dark:text-zinc-100">{t('triggerTitle')}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">{t('auditLogged')}</span>
          </div>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-4">
            {t('triggerDesc')}
          </p>

          <div className="flex gap-2 flex-wrap">
            {startups.map(s => (
              <button
                key={s.id}
                onClick={() => startImpersonation(s.id!)}
                disabled={isLogging}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors font-sans",
                  "bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800",
                  "text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50",
                  isLogging && "opacity-70 cursor-not-allowed"
                )}
              >
                {isLogging && selectedId === s.id ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                {s.founderName?.split(' ')[0] || s.name}
              </button>
            ))}
          </div>

          {impersonating && (
            <div className="mt-4 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 flex items-center gap-2">
              <AlertTriangle size={14} className="text-zinc-500" />
              <span className="text-[13px] text-zinc-700 dark:text-zinc-300">{t('activeMode')}</span>
              <button onClick={exitImpersonation} className="ml-auto text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline font-sans">
                {t('end')}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
