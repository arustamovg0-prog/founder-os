'use client';

import { useState } from 'react';
import { MOCK_STARTUPS } from '@/lib/mockData';
import { Eye, X, AlertTriangle, Shield, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImpersonationBannerProps {
  targetName: string;
  targetRole: string;
  onExit: () => void;
}

/**
 * Баннер — показывается когда admin просматривает платформу от лица другого пользователя.
 */
export function ImpersonationBanner({ targetName, targetRole, onExit }: ImpersonationBannerProps) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(90deg, rgba(113,113,122,0.95), rgba(82,82,91,0.95))',
      padding: '10px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Shield size={16} color="white" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
          ADMIN MODE — Просмотр от лица:
        </span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.2)', padding: '2px 10px', borderRadius: '99px' }}>
          {targetName} ({targetRole})
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Действия логируются в Digital Footprint</span>
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
        <X size={13} /> Выйти из режима
      </button>
    </div>
  );
}

/**
 * Кнопка и модалка для Admin Impersonation
 * Вставляется в Admin → Startups страницу
 */
export function ImpersonationPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateTarget, setImpersonateTarget] = useState<{ name: string; role: string } | null>(null);

  const startImpersonation = (startupId: string) => {
    const startup = MOCK_STARTUPS.find(s => s.id === startupId);
    if (!startup) return;

    // Логируем в digital_footprint (в реальном Firebase — через Server Action)
    console.info(`[AUDIT] Admin impersonating founder of ${startup.name} at ${new Date().toISOString()}`);

    setImpersonateTarget({ name: startup.founderName || startup.name, role: 'founder' });
    setImpersonating(true);
    setSelectedId(null);

    toast.success(`Переключились на вид: ${startup.founderName}`, { icon: '👁️' });

    // В реальном сценарии: redirect на /founder с impersonation token в headers
    // Здесь — показываем баннер
  };

  const exitImpersonation = () => {
    setImpersonating(false);
    setImpersonateTarget(null);
    toast.success('Вернулись в Admin режим', { icon: '🛡️' });
  };

  return (
    <>
      {/* Impersonation Banner */}
      {impersonating && impersonateTarget && (
        <ImpersonationBanner
          targetName={impersonateTarget.name}
          targetRole={impersonateTarget.role}
          onExit={exitImpersonation}
        />
      )}

      {/* Trigger Block */}
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(113,113,122,0.04)', borderColor: 'rgba(113,113,122,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <UserCheck size={18} color="#71717A" />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700 }}>Admin Impersonation</span>
          <span className="badge badge-yellow">Audit Logged</span>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: '16px' }}>
          Просматривай платформу от лица любого фаундера. Все действия фиксируются в Digital Footprint.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {MOCK_STARTUPS.slice(0, 4).map(s => (
            <button
              key={s.id}
              onClick={() => startImpersonation(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '10px', fontSize: 13,
                background: 'rgba(113,113,122,0.08)', border: '1px solid rgba(113,113,122,0.2)',
                color: '#D4D4D8', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500,
              }}
            >
              <Eye size={13} />
              {s.founderName?.split(' ')[0] || s.name}
            </button>
          ))}
        </div>

        {impersonating && (
          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(113,113,122,0.1)', border: '1px solid rgba(113,113,122,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={14} color="#71717A" />
            <span style={{ fontSize: 13, color: '#D4D4D8' }}>Активный режим — баннер отображается в интерфейсе</span>
            <button onClick={exitImpersonation} style={{ marginLeft: 'auto', fontSize: 12, color: '#71717A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', textDecoration: 'underline' }}>
              Завершить
            </button>
          </div>
        )}
      </div>
    </>
  );
}
