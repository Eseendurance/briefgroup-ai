import { Plan, Prisma, SubscriptionStatus } from "@prisma/client";
import { getPrisma } from "@/app/lib/prisma";

export function workspaceSeatLimit(plan: Plan) {
  switch (plan) {
    case Plan.PRO:
      return 1;
    case Plan.BUSINESS:
      return 5;
    case Plan.ENTERPRISE:
      return Number.MAX_SAFE_INTEGER;
    case Plan.FREE:
      return 1;
  }
}

export function workspaceCreditLimit(plan: Plan, status: SubscriptionStatus) {
  if (status === SubscriptionStatus.TRIALING) return 1_000;
  switch (plan) {
    case Plan.PRO:
      return 10_000;
    case Plan.BUSINESS:
      return 50_000;
    case Plan.ENTERPRISE: {
      const configured = Number(process.env.ENTERPRISE_MONTHLY_AI_CREDITS);
      return Number.isSafeInteger(configured) && configured > 0 ? configured : 500_000;
    }
    case Plan.FREE:
      return 0;
  }
}

export function utcMonthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function reserveWorkspaceCredits(input: {
  workspaceId: string;
  credits: number;
  limit: number;
}) {
  if (!Number.isSafeInteger(input.credits) || input.credits < 1) {
    throw new Error("Credit reservation must be a positive integer.");
  }
  const prisma = getPrisma();
  const periodStart = utcMonthStart();
  try {
    await prisma.workspaceUsage.upsert({
      where: {
        workspaceId_periodStart: { workspaceId: input.workspaceId, periodStart },
      },
      update: {},
      create: { workspaceId: input.workspaceId, periodStart },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }

  const reservation = await prisma.workspaceUsage.updateMany({
    where: {
      workspaceId: input.workspaceId,
      periodStart,
      usedCredits: { lte: input.limit - input.credits },
    },
    data: {
      usedCredits: { increment: input.credits },
      reservedCredits: { increment: input.credits },
    },
  });
  if (reservation.count !== 1) return null;
  return { periodStart, reservedCredits: input.credits };
}

export async function settleWorkspaceCredits(input: {
  workspaceId: string;
  userId: string;
  periodStart: Date;
  reservedCredits: number;
  actualCredits: number;
  endpoint: string;
  tokensUsed: number;
}) {
  if (
    !Number.isSafeInteger(input.actualCredits) ||
    input.actualCredits < 0 ||
    input.actualCredits > input.reservedCredits
  ) {
    throw new Error("Final credit usage is outside the reserved amount.");
  }
  const prisma = getPrisma();
  await prisma.$transaction(async (transaction) => {
    const settled = await transaction.workspaceUsage.updateMany({
      where: {
        workspaceId: input.workspaceId,
        periodStart: input.periodStart,
        reservedCredits: { gte: input.reservedCredits },
      },
      data: {
        usedCredits: { decrement: input.reservedCredits - input.actualCredits },
        reservedCredits: { decrement: input.reservedCredits },
      },
    });
    if (settled.count !== 1) {
      throw new Error("Workspace credit reservation could not be settled.");
    }
    await transaction.usageLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        endpoint: input.endpoint,
        tokensUsed: input.tokensUsed,
        creditsUsed: input.actualCredits,
      },
    });
  });
}

export async function releaseWorkspaceCredits(input: {
  workspaceId: string;
  periodStart: Date;
  reservedCredits: number;
}) {
  await getPrisma().workspaceUsage.updateMany({
    where: {
      workspaceId: input.workspaceId,
      periodStart: input.periodStart,
      reservedCredits: { gte: input.reservedCredits },
    },
    data: {
      usedCredits: { decrement: input.reservedCredits },
      reservedCredits: { decrement: input.reservedCredits },
    },
  });
}
