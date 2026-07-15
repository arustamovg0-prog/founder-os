'use client';

import { useState } from 'react';

import { Video, Mic, MicOff, Camera, CameraOff, MonitorUp, PhoneOff, Users, MessageSquare, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function VideoPitchRoomPage({ params }: { params: { id: string } }) {
  const t = useTranslations('FounderPitchRoom');
  const router = useRouter();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'ai'>('ai');

  const handleLeave = () => {
    toast(t('leavingRoom'), { icon: '👋' });
    router.push('/founder/pitches');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>{t('title')}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#D4D4D8' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4D4D8', boxShadow: '0 0 6px #D4D4D8' }} />
            {t('recordingActive')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Main Video Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Stage */}
          <div style={{ flex: 1, background: '#0a0a14', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {camOn ? (
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <Video size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <div>{t('investorCameraPlaceholder')}</div>
              </div>
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff' }}>I</div>
            )}
            
            <div style={{ position: 'absolute', bottom: 16, left: 16, padding: '6px 12px', background: 'rgba(0,0,0,0.6)', borderRadius: '8px', fontSize: 13, color: '#f8fafc', backdropFilter: 'blur(4px)' }}>
              Aibek Ventures ({t('investorLabel')})
            </div>
          </div>

          {/* Self View & Controls */}
          <div style={{ display: 'flex', gap: '16px', height: '180px' }}>
            <div style={{ width: '300px', background: '#0f111a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {camOn ? (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>{t('selfFeedPlaceholder')}</div>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#D8B4FE' }}>Me</div>
              )}
              <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '4px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', fontSize: 11, color: '#f8fafc', backdropFilter: 'blur(4px)' }}>
                {t('youFounder')}
              </div>
            </div>

            {/* Controls */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <button onClick={() => setMicOn(!micOn)} style={{ width: 56, height: 56, borderRadius: '50%', background: micOn ? 'rgba(255,255,255,0.1)' : 'rgba(82,82,91,0.2)', border: `1px solid ${micOn ? 'rgba(255,255,255,0.1)' : 'rgba(82,82,91,0.4)'}`, color: micOn ? '#fff' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-standard)' }}>
                {micOn ? <Mic size={24} /> : <MicOff size={24} />}
              </button>
              <button onClick={() => setCamOn(!camOn)} style={{ width: 56, height: 56, borderRadius: '50%', background: camOn ? 'rgba(255,255,255,0.1)' : 'rgba(82,82,91,0.2)', border: `1px solid ${camOn ? 'rgba(255,255,255,0.1)' : 'rgba(82,82,91,0.4)'}`, color: camOn ? '#fff' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-standard)' }}>
                {camOn ? <Camera size={24} /> : <CameraOff size={24} />}
              </button>
              <button style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(161,161,170,0.15)', border: '1px solid rgba(161,161,170,0.3)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <MonitorUp size={24} />
              </button>
              <button onClick={handleLeave} style={{ width: 72, height: 56, borderRadius: '28px', background: '#52525B', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: '16px', boxShadow: '0 4px 12px rgba(82,82,91,0.3)' }}>
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: '320px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => setActiveTab('ai')} style={{ flex: 1, padding: '16px', background: activeTab === 'ai' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'ai' ? '#D8B4FE' : '#64748b', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
              <Brain size={14} /> {t('tabs.aiNotes')}
            </button>
            <button onClick={() => setActiveTab('chat')} style={{ flex: 1, padding: '16px', background: activeTab === 'chat' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'chat' ? '#f8fafc' : '#64748b', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
              <MessageSquare size={14} /> {t('tabs.chat')}
            </button>
          </div>

          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {activeTab === 'ai' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: 11, color: '#D8B4FE', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>{t('ai.liveSummary')}</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
                    {t('ai.liveSummaryText')}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(161,161,170,0.1)', border: '1px solid rgba(161,161,170,0.2)' }}>
                  <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>{t('ai.suggestion')}</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
                    {t('ai.suggestionText')}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>{t('chat.noMessages')}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
