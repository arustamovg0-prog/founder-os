'use client';

import { useState } from 'react';
import { ROADMAP_STAGES, MOCK_STARTUPS } from '@/lib/mockData';
import { CheckCircle, Lock, Clock, AlertCircle, Upload, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const MY_STARTUP = MOCK_STARTUPS[0];

const PHASE_COLORS: Record<string, string> = {
  discovery: '#06b6d4', validation: '#f59e0b',
  building: '#7c3aed', scaling: '#10b981', fundraising: '#ec4899',
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
  completed: { icon: <CheckCircle size={16} />, label: 'Completed', color: '#10b981' },
  in_progress: { icon: <Clock size={16} />, label: 'In Progress', color: '#f59e0b' },
  pending_review: { icon: <AlertCircle size={16} />, label: 'Pending Review', color: '#3b82f6' },
  locked: { icon: <Lock size={16} />, label: 'Locked', color: '#334155' },
};

export default function RoadmapPage() {
  const [expanded, setExpanded] = useState<string | null>('stage_5_fundraising');
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = (artifactKey: string) => {
    setUploading(artifactKey);
    setTimeout(() => {
      setUploading(null);
      toast.success('Artifact uploaded successfully!', { icon: '📎' });
    }, 1500);
  };

  const completedCount = Object.values(STAGE_STATES).filter(s => s === 'completed').length;
  const totalCount = ROADMAP_STAGES.length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
          Startup Roadmap
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Your structured path from idea to investment readiness
        </p>
      </div>

      {/* Overall Progress */}
      <div className="card" style={{ marginBottom: '28px', background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: '#a78bfa' }}>
              {MY_STARTUP.roadmapProgress}%
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {completedCount} of {totalCount} stages completed
            </div>
          </div>
          <span className="badge badge-purple">Investment Ready Track</span>
        </div>
        <div className="progress-bar" style={{ height: '8px' }}>
          <div className="progress-fill" style={{ width: `${MY_STARTUP.roadmapProgress}%` }} />
        </div>
      </div>

      {/* Stages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {ROADMAP_STAGES.map((stage, idx) => {
          const state = STAGE_STATES[stage.id] || 'locked';
          const cfg = STATE_CONFIG[state];
          const phaseColor = PHASE_COLORS[stage.phase];
          const isExpanded = expanded === stage.id;
          const isActive = state === 'in_progress' || state === 'pending_review';

          return (
            <div key={stage.id} style={{
              borderRadius: '16px',
              border: `1px solid ${isActive ? 'rgba(124,58,237,0.3)' : state === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
              background: isActive ? 'rgba(124,58,237,0.05)' : state === 'locked' ? 'rgba(255,255,255,0.01)' : 'rgba(13,13,32,0.8)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
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
                  background: state === 'completed' ? 'rgba(16,185,129,0.2)' : state === 'locked' ? 'rgba(255,255,255,0.03)' : `${phaseColor}20`,
                  border: `2px solid ${state === 'completed' ? '#10b981' : state === 'locked' ? 'rgba(255,255,255,0.08)' : phaseColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15,
                  color: state === 'completed' ? '#10b981' : state === 'locked' ? '#334155' : phaseColor,
                }}>
                  {state === 'completed' ? '✓' : idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: state === 'locked' ? '#334155' : '#f8fafc' }}>
                      {stage.title}
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
                      <span className="badge badge-yellow">Gatekeeper</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#475569' }}>{stage.description}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: cfg.color }}>
                    {cfg.icon}
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{cfg.label}</span>
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
                      Required Artifacts
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {stage.requiredArtifacts.map((art) => {
                        const isDone = state === 'completed';
                        return (
                          <div key={art.key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', borderRadius: '10px',
                            background: isDone ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {isDone
                                ? <CheckCircle size={14} color="#10b981" />
                                : <Upload size={14} color="#64748b" />
                              }
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: isDone ? '#34d399' : '#94a3b8' }}>{art.label}</div>
                                <div style={{ fontSize: 11, color: '#334155' }}>Type: {art.type} • {art.isRequired ? 'Required' : 'Optional'}</div>
                              </div>
                            </div>
                            {!isDone && (
                              <button
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: '6px 14px' }}
                                onClick={() => handleUpload(art.key)}
                                disabled={uploading === art.key}
                              >
                                {uploading === art.key ? (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                                    Uploading...
                                  </span>
                                ) : (
                                  <><Upload size={12} /> Upload</>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {stage.unlockConditions.adminVerificationRequired && (
                      <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Zap size={14} color="#60a5fa" />
                          <span style={{ fontSize: 13, color: '#60a5fa' }}>
                            This stage requires UNTITLED team verification before unlocking
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
