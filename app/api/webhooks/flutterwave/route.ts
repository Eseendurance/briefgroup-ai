import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { PaymentGateway, Plan } from "@prisma/client";
import {
  activateWorkspaceSubscription,
  beginBillingEvent,
  completeBillingEvent,
  isPlan,
  setWorkspaceSubscriptionStatus,
  subscriptionStatus,
} from "@/app/lib/billing-webhook";
import { getPrisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

type FlutterwaveEvent = {
  id?: string | number;
  type?: string;
  event?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    status?: string;
    meta?: { workspaceId?: string; plan?: string };
    customer?: { id?: string | number; email?: string };
  };
};

type VerifiedTransaction = {
  status?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    status?: string;
    amount?: number;
    currency?: string;
    customer?: { id?: string | number; email?: string };
    meta?: { workspaceId?: string; plan?: string };
  };
};

function expectedAmount(plan: Plan) {
  const rawAmount =
    plan === Plan.PRO
      ? process.env.FLUTTERWAVE_PRO_AMOUNT_NGN
      : plan === Plan.BUSINESS
        ? process.env.FLUTTERWAVE_BUSINESS_AMOUNT_NGN
        : undefined;
  const amount = Number(rawAmount);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function validWebhookHash(provided: string, expected: string) {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return (
    providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes)
  );
}

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 65_536) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const providedHash = request.headers.get("verif-hash");
  if (!webhookSecret || !providedHash) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  if (!validWebhookHash(providedHash, webhookSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: FlutterwaveEvent;
  try {
    event = (await request.json()) as FlutterwaveEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  const data = event.data;
  if (!data?.id) {
    return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });
  }
  const eventType = event.type ?? event.event ?? "unknown";
  const eventId = `${event.id ?? eventType}:${data.id}`;
  const pendingEvent = await beginBillingEvent(
    PaymentGateway.FLUTTERWAVE,
    eventId,
    eventType,
  );
  if (!pendingEvent || pendingEvent.state === "PROCESSED") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (pendingEvent.state === "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Webhook event is already being processed." },
      { status: 409, headers: { "Retry-After": "5" } },
    );
  }

  if (data.status === "successful" || eventType === "charge.completed") {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 });
    }
    const verificationResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${data.id}/verify`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        cache: "no-store",
      },
    );
    const verification = (await verificationResponse.json()) as VerifiedTransaction;
    const verified = verification.data;
    const prisma = getPrisma();
    const attempt = verified?.tx_ref
      ? await prisma.checkoutAttempt.findFirst({
          where: {
            gateway: PaymentGateway.FLUTTERWAVE,
            providerReference: verified.tx_ref,
          },
        })
      : null;
    const providerCustomerId = verified?.customer?.id
      ? String(verified.customer.id)
      : data.customer?.id
        ? String(data.customer.id)
        : undefined;
    const linkedWorkspace = providerCustomerId
      ? await prisma.workspace.findFirst({
          where: {
            gateway: PaymentGateway.FLUTTERWAVE,
            gatewayCustomerId: providerCustomerId,
          },
        })
      : null;
    const workspaceId =
      verified?.meta?.workspaceId ??
      data.meta?.workspaceId ??
      attempt?.workspaceId ??
      linkedWorkspace?.id;
    const workspace = workspaceId
      ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
      : null;
    const planValue =
      verified?.meta?.plan ?? data.meta?.plan ?? attempt?.plan ?? workspace?.plan;
    const plan = isPlan(planValue) ? planValue : null;
    if (
      !verificationResponse.ok ||
      verification.status !== "success" ||
      verified?.status !== "successful" ||
      verified.currency !== "NGN" ||
      !workspaceId ||
      !plan ||
      !workspace
    ) {
      return NextResponse.json(
        { error: "Payment could not be verified." },
        { status: 400 },
      );
    }

    if (
      (attempt &&
        (attempt.workspaceId !== workspaceId || attempt.plan !== plan)) ||
      (!attempt &&
        (linkedWorkspace?.id !== workspaceId || workspace.plan !== plan)) ||
      !expectedAmount(plan) ||
      verified.amount !== expectedAmount(plan)
    ) {
      return NextResponse.json(
        { error: "Payment does not match a workspace subscription or configured plan amount." },
        { status: 400 },
      );
    }
    await activateWorkspaceSubscription({
      gateway: PaymentGateway.FLUTTERWAVE,
      workspaceId,
      plan,
      customerId: verified.customer?.id ? String(verified.customer.id) : null,
      billingEmail: verified.customer?.email ?? data.customer?.email ?? null,
      ...(attempt ? { attemptReference: verified.tx_ref } : {}),
    });
  } else if (
    eventType === "subscription.cancelled" ||
    eventType === "charge.failed"
  ) {
    const prisma = getPrisma();
    const workspaceId =
      data.meta?.workspaceId ??
      (data.customer?.id
        ? (
            await prisma.workspace.findFirst({
              where: {
                gateway: PaymentGateway.FLUTTERWAVE,
                gatewayCustomerId: String(data.customer.id),
              },
            })
          )?.id
        : undefined);
    if (workspaceId) {
      await setWorkspaceSubscriptionStatus({
        gateway: PaymentGateway.FLUTTERWAVE,
        workspaceId,
        status:
          eventType === "charge.failed"
            ? subscriptionStatus("past_due")
            : subscriptionStatus("canceled"),
      });
    }
  }

  await completeBillingEvent(eventId, PaymentGateway.FLUTTERWAVE);
  return NextResponse.json({ received: true });
}
