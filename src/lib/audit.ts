import { prisma } from "./prisma";

export async function logAudit(params: {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      meta: params.meta ? JSON.parse(JSON.stringify(params.meta)) : undefined,
    },
  });
}
