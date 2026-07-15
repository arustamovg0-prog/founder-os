'use client';

import { useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup } from '@/types';
import { Eye, X, AlertTriangle, Shield, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { logImpersonationAction } from '@/app/actions/audit';
import { useTranslations } from 'next-intl';

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
        <Shield size={16} color="white" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
          {t('adminMode')}
        </span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.2)', padding: '2px 10px', borderRadius: '99px' }}>
          {targetName} ({targetRole})
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{t('actionsLogged')}</span>
      </div>
      <button
        onClick={onExit}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 16px', borderRadius: '8px',
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.3)',
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

  import('react').then(({ useEffect }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      getDocs(query(collection(db, 'startups'), limit(4))).then(snap => {
        setStartups(snap.docs.map(d => ({ id: d.id, ...d.data() } as Startup)));
      }).catch(err => console.warn('Failed to fetch startups for impersonation', err));
    }, []);
  });

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

    toast.success(t('successMode', { name: startup.founderName, hash: auditRes.hash?.substring(0, 8) }), { icon: '👁️' });

    // В реальном сценарии: redirect на /founder с impersonation token в headers
    // Здесь — показываем баннер
  };

  const exitImpersonation = () => {
    setImpersonating(false);
    setImpersonateTarget(null);
    toast.success(t('exitSuccess'), { icon: '🛡️' });
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
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(113,113,122,0.04)', borderColor: 'rgba(113,113,122,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <UserCheck size={18} color="#71717A" />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700 }}>{t('triggerTitle')}</span>
          <span className="badge badge-yellow">{t('auditLogged')}</span>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: '16px' }}>
          {t('triggerDesc')}
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {startups.map(s => (
            <button
              key={s.id}
              onClick={() => startImpersonation(s.id!)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '10px', fontSize: 13,
                background: 'rgba(113,113,122,0.08)', border: '1px solid rgba(113,113,122,0.2)',
                color: '#D4D4D8', cursor: isLogging ? 'not-allowed' : 'pointer', fontFamily: 'Inter', fontWeight: 500,
                opacity: isLogging ? 0.7 : 1
              }}
              disabled={isLogging}
            >
              {isLogging && selectedId === s.id ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
              {s.founderName?.split(' ')[0] || s.name}
            </button>
          ))}
        </div>

        {impersonating && (
          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(113,113,122,0.1)', border: '1px solid rgba(113,113,122,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={14} color="#71717A" />
            <span style={{ fontSize: 13, color: '#D4D4D8' }}>{t('activeMode')}</span>
            <button onClick={exitImpersonation} style={{ marginLeft: 'auto', fontSize: 12, color: '#71717A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', textDecoration: 'underline' }}>
              {t('end')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
