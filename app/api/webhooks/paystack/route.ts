import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
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

type PaystackEvent = {
  event?: string;
  data?: {
    id?: number;
    reference?: string;
    status?: string;
    subscription_code?: string;
    customer?: { customer_code?: string; email?: string };
    next_payment_date?: string | null;
    metadata?: { workspaceId?: string; plan?: string };
  };
};

function validSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

async function verifyCharge(reference: string, secret: string, amount: number) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: "Bearer " + secret },
      cache: "no-store",
    },
  );
  const result = (await response.json()) as {
    status?: boolean;
    data?: { status?: string; amount?: number; currency?: string };
  };
  return (
    response.ok &&
    result.status === true &&
    result.data?.status === "success" &&
    result.data.currency === "NGN" &&
    result.data.amount === amount
  );
}

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 65_536) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = request.headers.get("x-paystack-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  const rawBody = await request.text();
  if (!validSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const data = event.data;
  if (!event.event || !data) {
    return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });
  }
  const eventId = `${event.event}:${data.id ?? data.reference ?? data.subscription_code ?? "unknown"}`;
  const claim = await beginBillingEvent(PaymentGateway.PAYSTACK, eventId, event.event);
  if (claim.state === "PROCESSED") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (claim.state === "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Webhook event is already being processed." },
      { status: 409, headers: { "Retry-After": "5" } },
    );
  }

  const prisma = getPrisma();
  const attempt = data.reference
    ? await prisma.checkoutAttempt.findFirst({
        where: {
          gateway: PaymentGateway.PAYSTACK,
          providerReference: data.reference,
        },
      })
    : null;
  const workspaceId =
    data.metadata?.workspaceId ??
    attempt?.workspaceId ??
    (data.customer?.customer_code
      ? (
          await prisma.workspace.findFirst({
            where: {
              gateway: PaymentGateway.PAYSTACK,
              gatewayCustomerId: data.customer.customer_code,
            },
          })
        )?.id
      : undefined);
  const savedWorkspace = workspaceId
    ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
    : null;
  const selectedPlan = isPlan(data.metadata?.plan)
    ? data.metadata.plan
    : attempt?.plan ?? savedWorkspace?.plan;

  if (event.event === "charge.success") {
    if (!workspaceId || !data.reference || !selectedPlan || selectedPlan === Plan.FREE) {
      return NextResponse.json(
        { error: "Payment is not linked to a valid workspace plan." },
        { status: 400 },
      );
    }
    const amount = Number(
      selectedPlan === Plan.PRO
        ? process.env.PAYSTACK_PRO_AMOUNT_KOBO
        : selectedPlan === Plan.BUSINESS
          ? process.env.PAYSTACK_BUSINESS_AMOUNT_KOBO
          : NaN,
    );
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "The Paystack plan amount is not configured." },
        { status: 503 },
      );
    }
    if (!(await verifyCharge(data.reference, secret, amount))) {
      return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
    }
    await activateWorkspaceSubscription({
      gateway: PaymentGateway.PAYSTACK,
      workspaceId,
      plan: selectedPlan,
      customerId: data.customer?.customer_code,
      subscriptionId: data.subscription_code,
      billingEmail: data.customer?.email,
      attemptReference: data.reference,
    });
  } else if (event.event === "subscription.create" && workspaceId && savedWorkspace) {
    await activateWorkspaceSubscription({
      gateway: PaymentGateway.PAYSTACK,
      workspaceId,
      plan:
        selectedPlan && selectedPlan !== Plan.FREE
          ? selectedPlan
          : savedWorkspace.plan === Plan.FREE
            ? Plan.PRO
            : savedWorkspace.plan,
      customerId: data.customer?.customer_code,
      subscriptionId: data.subscription_code,
      billingEmail: data.customer?.email,
    });
  } else if (
    (event.event === "subscription.disable" ||
      event.event === "subscription.not_renew" ||
      event.event === "invoice.payment_failed") &&
    workspaceId
  ) {
    await setWorkspaceSubscriptionStatus({
      gateway: PaymentGateway.PAYSTACK,
      workspaceId,
      status:
        event.event === "invoice.payment_failed"
          ? subscriptionStatus("past_due")
          : subscriptionStatus("canceled"),
      ...(data.next_payment_date
        ? { periodEnd: new Date(data.next_payment_date) }
        : {}),
    });
  }

  await completeBillingEvent(eventId, PaymentGateway.PAYSTACK);
  return NextResponse.json({ received: true });
}
