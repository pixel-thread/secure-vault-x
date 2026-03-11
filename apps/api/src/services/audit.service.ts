import { prisma } from "@securevault/database";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "MFA_TOGGLE"
  | "PASSWORD_CHANGE"
  | "VAULT_SYNC"
  | "DEVICE_REGISTER"
  | "DEVICE_REMOVE"
  | "DEVICE_TRUST_UPDATE"
  | "OTP_GENERATE"
  | "OTP_VERIFY";

export class AuditLogger {
  static async log(params: {
    userId?: string;
    action: AuditAction;
    metadata?: any;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          metadata: params.metadata,
          ip: params.ip,
          userAgent: params.userAgent,
        },
      });
    } catch (error: any) {
      console.error("Error logging audit:", error.message);
      return;
    }
  }
}
