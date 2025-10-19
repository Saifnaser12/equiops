import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  entityType: string;
  entityId: string;
  action: string;
  changedBy?: string;
  diffJson?: string;
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        changedBy: data.changedBy || 'system',
        diffJson: data.diffJson,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

export function createAuditDiff<T>(oldData: Partial<T>, newData: Partial<T>): string {
  const diff: Record<string, { old: any; new: any }> = {};
  
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  
  for (const key of allKeys) {
    const oldValue = oldData[key as keyof T];
    const newValue = newData[key as keyof T];
    
    if (oldValue !== newValue) {
      diff[key] = { old: oldValue, new: newValue };
    }
  }
  
  return Object.keys(diff).length > 0 ? JSON.stringify(diff) : '';
}