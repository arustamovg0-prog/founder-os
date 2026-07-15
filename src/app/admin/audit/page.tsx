'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, Clock, Search, ChevronRight, Hash, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SignedEvidenceRecord } from '@/lib/trust/evidence';

export default function AuditEvidencePage() {
  const [records, setRecords] = useState<SignedEvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const q = query(collection(db, 'audit_evidence'), orderBy('timestamp_utc', 'desc'), limit(100));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({ ...d.data(), id: d.id } as SignedEvidenceRecord & { id: string }));
        setRecords(fetched);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
  }, []);

  const filtered = records.filter(r => 
    r.action_type.toLowerCase().includes(search.toLowerCase()) || 
    r.agent_id.toLowerCase().includes(search.toLowerCase()) ||
    r.record_hash.includes(search)
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 6 }}>
            <Shield size={16} color="#D8B4FE" />
            <span style={{ fontSize: 13, color: '#D8B4FE', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Security & Trust</span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Journal of Evidence</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Immutable audit log of all critical agent and admin actions</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input 
              className="input-field" 
              placeholder="Search by Hash, Agent ID or Action..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ paddingLeft: '36px' }} 
            />
          </div>
          <span style={{ fontSize: 13, color: '#475569', flexShrink: 0 }}>{filtered.length} records</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading immutable logs...</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '80px', color: '#334155' }}>
            <Shield size={40} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
            <p>No evidence records found</p>
          </div>
        ) : (
          filtered.map((record, index) => {
            const isSelected = selectedHash === record.record_hash;
            // Check chain integrity locally (naive check just for UI purposes)
            const isChainValid = index < filtered.length - 1 ? record.prev_record_hash === filtered[index + 1].record_hash : true;
            
            return (
              <div 
                key={record.record_hash}
                onClick={() => setSelectedHash(isSelected ? null : record.record_hash)}
                style={{ 
                  borderRadius: 14, 
                  background: 'rgba(13,13,32,0.5)', 
                  border: `1px solid ${isSelected ? 'rgba(216,180,254,0.3)' : 'rgba(255,255,255,0.06)'}`, 
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'var(--transition-standard)'
                }}
              >
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{record.action_type}</span>
                      <span className={`badge ${record.decision === 'APPROVED' ? 'badge-green' : 'badge-red'}`}>
                        {record.decision}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12, color: '#94a3b8' }}>
                        <Hash size={12} /> 
                        <span style={{ fontFamily: 'monospace' }}>{record.record_hash.substring(0, 16)}...</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12, color: '#64748b' }}>
                        <Clock size={12} /> 
                        {new Date(record.timestamp_utc).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {isChainValid ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 99 }}>
                        <ShieldCheck size={12} /> Chain Valid
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: 99 }}>
                        <AlertTriangle size={12} /> Chain Broken
                      </div>
                    )}
                    <ChevronRight size={16} color="#475569" style={{ transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Metadata</div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px', fontSize: 12, fontFamily: 'monospace', color: '#cbd5e1' }}>
                          <div style={{ marginBottom: 4 }}><span style={{ color: '#64748b' }}>Agent ID:</span> {record.agent_id}</div>
                          <div style={{ marginBottom: 4 }}><span style={{ color: '#64748b' }}>Prev Hash:</span> {record.prev_record_hash}</div>
                          <div style={{ marginBottom: 4 }}><span style={{ color: '#64748b' }}>Signature:</span> {record.signature}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Intent Payload</div>
                        <pre style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px', fontSize: 12, margin: 0, overflowX: 'auto', color: '#cbd5e1' }}>
                          {JSON.stringify(record.intent, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
