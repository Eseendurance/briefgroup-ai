import {
  BillingEventStatus,
  CheckoutStatus,
  PaymentGateway,
  Plan,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";
import { getPrisma } from "@/app/lib/prisma";

export function isPlan(value: unknown): value is Plan {
  return value === Plan.PRO || value === Plan.BUSINESS || value === Plan.ENTERPRISE;
}

export function subscriptionStatus(value: unknown): SubscriptionStatus {
  if (value === "active") return SubscriptionStatus.ACTIVE;
  if (value === "trialing") return SubscriptionStatus.TRIALING;
  if (value === "past_due" || value === "unpaid") return SubscriptionStatus.PAST_DUE;
  if (value === "canceled" || value === "cancelled") return SubscriptionStatus.CANCELED;
  return SubscriptionStatus.EXPIRED;
}

export async function beginBillingEvent(
  gateway: PaymentGateway,
  eventId: string,
  eventType: string,
) {
  const prisma = getPrisma();
  try {
    const event = await prisma.billingEvent.create({
      data: { gateway, eventId, eventType },
    });
    return { state: "CLAIMED" as const, event };
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }

    const existing = await prisma.billingEvent.findUnique({
      where: { gateway_eventId: { gateway, eventId } },
    });
    if (!existing) throw error;
    if (existing.status === BillingEventStatus.PROCESSED) {
      return { state: "PROCESSED" as const, event: existing };
    }

    const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
    if (existing.updatedAt > staleBefore) {
      return { state: "IN_PROGRESS" as const, event: existing };
    }

    const claim = await prisma.billingEvent.updateMany({
      where: {
        id: existing.id,
        status: BillingEventStatus.PROCESSING,
        updatedAt: { lte: staleBefore },
      },
      data: { updatedAt: new Date(), eventType },
    });
    if (claim.count === 0) {
      return { state: "IN_PROGRESS" as const, event: existing };
    }
    const reclaimed = await prisma.billingEvent.findUniqueOrThrow({
      where: { id: existing.id },
    });
    return { state: "CLAIMED" as const, event: reclaimed };
  }
}

export async function completeBillingEvent(eventId: string, gateway: PaymentGateway) {
  await getPrisma().billingEvent.update({
    where: { gateway_eventId: { gateway, eventId } },
    data: { status: BillingEventStatus.PROCESSED, processedAt: new Date() },
  });
}

export async function activateWorkspaceSubscription(input: {
  gateway: PaymentGateway;
  workspaceId: string;
  plan: Plan;
  customerId?: string | null;
  subscriptionId?: string | null;
  priceId?: string | null;
  billingEmail?: string | null;
  periodEnd?: Date | null;
  attemptReference?: string | null;
}) {
  const prisma = getPrisma();
  await prisma.$transaction(async (transaction) => {
    await transaction.workspace.update({
      where: { id: input.workspaceId },
      data: {
        gateway: input.gateway,
        plan: input.plan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        ...(input.customerId !== undefined
          ? { gatewayCustomerId: input.customerId }
          : {}),
        ...(input.subscriptionId !== undefined
          ? { gatewaySubscriptionId: input.subscriptionId }
          : {}),
        ...(input.priceId !== undefined ? { gatewayPriceId: input.priceId } : {}),
        ...(input.billingEmail !== undefined
          ? { billingEmail: input.billingEmail }
          : {}),
        ...(input.periodEnd !== undefined ? { currentPeriodEnd: input.periodEnd } : {}),
      },
    });
    if (input.attemptReference) {
      await transaction.checkoutAttempt.updateMany({
        where: {
          gateway: input.gateway,
          providerReference: input.attemptReference,
        },
        data: { status: CheckoutStatus.COMPLETED },
      });
    }
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        action: `billing.subscription.${input.plan.toLowerCase()}.activated`,
      },
    });
  });
}

export async function setWorkspaceSubscriptionStatus(input: {
  gateway: PaymentGateway;
  workspaceId: string;
  status: SubscriptionStatus;
  periodEnd?: Date | null;
}) {
  const prisma = getPrisma();
  await prisma.$transaction(async (transaction) => {
    await transaction.workspace.update({
      where: { id: input.workspaceId },
      data: {
        gateway: input.gateway,
        subscriptionStatus: input.status,
        ...(input.periodEnd !== undefined ? { currentPeriodEnd: input.periodEnd } : {}),
      },
    });
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        action: `billing.subscription.${input.status.toLowerCase()}`,
      },
    });
  });
}
