"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = logAuditEvent;
exports.createAuditDiff = createAuditDiff;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function logAuditEvent(data) {
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
    }
    catch (error) {
        console.error('Failed to log audit event:', error);
        // Don't throw - audit logging should not break the main flow
    }
}
function createAuditDiff(oldData, newData) {
    const diff = {};
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    for (const key of allKeys) {
        const oldValue = oldData[key];
        const newValue = newData[key];
        if (oldValue !== newValue) {
            diff[key] = { old: oldValue, new: newValue };
        }
    }
    return Object.keys(diff).length > 0 ? JSON.stringify(diff) : '';
}
//# sourceMappingURL=audit.js.map