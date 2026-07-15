import crypto from 'crypto';

export interface EvidenceRecordData {
  agent_id: string;
  action_type: string;
  intent: Record<string, any>;
  decision: string;
  outcome?: Record<string, any>;
  timestamp_utc: string;
  prev_record_hash: string;
}

export interface SignedEvidenceRecord extends EvidenceRecordData {
  record_hash: string;
  signature: string;
}

/**
 * Генерирует неизменяемую запись (Evidence Record) с цепочкой доверия.
 */
export function createEvidenceRecord(
  agentId: string,
  actionType: string,
  intent: Record<string, any>,
  decision: string,
  prevRecordHash: string,
  outcome?: Record<string, any>
): SignedEvidenceRecord {
  const record: EvidenceRecordData = {
    agent_id: agentId,
    action_type: actionType,
    intent,
    decision,
    outcome,
    timestamp_utc: new Date().toISOString(),
    prev_record_hash: prevRecordHash || '0'.repeat(64),
  };

  // Canonical JSON (sorted keys) to ensure consistent hashing
  const canonical = JSON.stringify(record, Object.keys(record).sort());
  
  // Хеширование для Chain Integrity
  const recordHash = crypto.createHash('sha256').update(canonical).digest('hex');

  // В реальном production здесь должна быть реальная криптографическая подпись (Ed25519)
  // Для демо-целей (так как у нас пока нет управления ключами агентов), используем HMAC
  // с серверным секретом (или просто хеш, если секрета нет).
  const serverSecret = process.env.AGENT_SECRET_KEY || 'default-dev-secret';
  const signature = crypto.createHmac('sha256', serverSecret).update(canonical).digest('hex');

  return {
    ...record,
    record_hash: recordHash,
    signature,
  };
}
