import auditLogSchema from '~/schema/auditLog';
import type { IAuditLog } from '~/types';

/**
 * Creates or returns the AuditLog model using the provided mongoose instance and schema
 */
export function createAuditLogModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
}