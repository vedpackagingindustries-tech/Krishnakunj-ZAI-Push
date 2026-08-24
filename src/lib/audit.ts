import { db, isDbAvailable } from '@/lib/db';

// ---------------------------------------------------------------------------
// Financial Audit Event
// ---------------------------------------------------------------------------

interface FinancialEvent {
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log a financial audit event (e.g. PAYMENT_SUCCESS, PAYMENT_FAILED).
 * Silently fails if DB is unavailable.
 */
export async function logFinancialEvent(event: FinancialEvent): Promise<void> {
  if (!isDbAvailable()) return;
  try {
    await db.auditLog.create({
      data: {
        adminId: null,
        adminName: '',
        action: event.action,
        category: 'FINANCIAL',
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: JSON.stringify(event.metadata),
        ipAddress: event.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('[audit] Failed to log financial event:', error);
  }
}

// ---------------------------------------------------------------------------
// Admin Audit Event
// ---------------------------------------------------------------------------

interface AdminEvent {
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log an admin audit event (e.g. LOGIN_SUCCESS, LOGIN_FAILED, PASSWORD_RESET).
 * Silently fails if DB is unavailable.
 */
export async function logAdminEvent(event: AdminEvent): Promise<void> {
  if (!isDbAvailable()) return;
  try {
    await db.auditLog.create({
      data: {
        adminId: event.adminId,
        adminName: event.adminName,
        action: event.action,
        category: 'ADMIN',
        entityType: event.entityType,
        entityId: event.entityId || null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        ipAddress: event.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('[audit] Failed to log admin event:', error);
  }
}
