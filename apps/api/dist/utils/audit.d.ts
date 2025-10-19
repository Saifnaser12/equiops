export interface AuditLogData {
    entityType: string;
    entityId: string;
    action: string;
    changedBy?: string;
    diffJson?: string;
}
export declare function logAuditEvent(data: AuditLogData): Promise<void>;
export declare function createAuditDiff<T>(oldData: Partial<T>, newData: Partial<T>): string;
//# sourceMappingURL=audit.d.ts.map