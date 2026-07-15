'use server';

import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { createEvidenceRecord, SignedEvidenceRecord } from '@/lib/trust/evidence';

/**
 * Логирует действие имперсонации в защищенный журнал (audit_evidence).
 * Выполняется ТОЛЬКО на сервере.
 */
export async function logImpersonationAction(targetId: string, targetName: string) {
  try {
    const adminDb = getAdminFirestore();
    const auditRef = adminDb.collection('audit_evidence');

    // 1. Получаем последнюю запись из базы для цепочки хешей
    const snapshot = await auditRef.orderBy('timestamp_utc', 'desc').limit(1).get();
    
    let prevRecordHash = '0'.repeat(64);
    if (!snapshot.empty) {
      const lastRecord = snapshot.docs[0].data() as SignedEvidenceRecord;
      prevRecordHash = lastRecord.record_hash;
    }

    // 2. Формируем Evidence Record
    // В реальном приложении agentId будет браться из сессии администратора
    const agentId = 'admin-session-id'; // Заглушка, пока нет полного auth
    const actionType = 'admin.impersonate';
    const intent = {
      target_id: targetId,
      target_name: targetName,
      reason: 'Support request or system administration',
    };
    
    const record = createEvidenceRecord(
      agentId,
      actionType,
      intent,
      'APPROVED',
      prevRecordHash,
      { status: 'impersonation_started' }
    );

    // 3. Сохраняем в Firestore (Admin SDK игнорирует Security Rules, 
    // поэтому запись пройдет даже если клиентский доступ закрыт)
    await auditRef.add(record);

    return { success: true, hash: record.record_hash };
  } catch (error) {
    console.error('Failed to write evidence record:', error);
    return { success: false, error: 'Audit failure' };
  }
}
