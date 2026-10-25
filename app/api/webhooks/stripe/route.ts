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

type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      id?: string;
      metadata?: { workspaceId?: string; plan?: string };
      customer?: string | null;
      subscription?: string | null;
      status?: string;
      payment_status?: string;
      current_period_end?: number;
      items?: { data?: { price?: { id?: string } }[] };
      customer_email?: string | null;
      customer_details?: { email?: string | null };
    };
  };
};

function verifyStripeSignature(rawBody: string, signature: string, secret: string) {
  const parts = signature.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return signatures.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    return (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    );
  });
}

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 65_536) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  if (!event.id || !event.type) {
    return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });
  }

  const pendingEvent = await beginBillingEvent(
    PaymentGateway.STRIPE,
    event.id,
    event.type,
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

  const resource = event.data?.object;
  const metadata = resource?.metadata;
  const workspaceId = metadata?.workspaceId;
  const plan = metadata?.plan;

  if (event.type === "checkout.session.completed" && resource) {
    if (
      workspaceId &&
      isPlan(plan) &&
      (resource.payment_status === "paid" ||
        resource.payment_status === "no_payment_required")
    ) {
      await activateWorkspaceSubscription({
        gateway: PaymentGateway.STRIPE,
        workspaceId,
        plan,
        customerId: resource.customer,
        subscriptionId: resource.subscription,
        billingEmail:
          resource.customer_details?.email ?? resource.customer_email ?? null,
        attemptReference: resource.id,
      });
    }
  } else if (
    (event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted") &&
    resource?.id
  ) {
    const prisma = getPrisma();
    const workspace =
      (workspaceId
        ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
        : null) ??
      (await prisma.workspace.findFirst({
        where: {
          gateway: PaymentGateway.STRIPE,
          gatewaySubscriptionId: resource.id,
        },
      }));
    if (workspace) {
      const status =
        event.type === "customer.subscription.deleted"
          ? subscriptionStatus("canceled")
          : subscriptionStatus(resource.status);
      if (status === "ACTIVE" || status === "TRIALING") {
        await activateWorkspaceSubscription({
          gateway: PaymentGateway.STRIPE,
          workspaceId: workspace.id,
          plan: isPlan(plan) ? plan : workspace.plan === Plan.FREE ? Plan.PRO : workspace.plan,
          customerId: resource.customer,
          subscriptionId: resource.id,
          priceId: resource.items?.data?.[0]?.price?.id ?? null,
          periodEnd: resource.current_period_end
            ? new Date(resource.current_period_end * 1000)
            : null,
        });
      } else {
        await setWorkspaceSubscriptionStatus({
          gateway: PaymentGateway.STRIPE,
          workspaceId: workspace.id,
          status,
          periodEnd: resource.current_period_end
            ? new Date(resource.current_period_end * 1000)
            : null,
        });
      }
    }
  } else if (event.type === "invoice.payment_failed") {
    const prisma = getPrisma();
    const workspace =
      (workspaceId
        ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
        : null) ??
      (resource?.subscription
        ? await prisma.workspace.findFirst({
            where: {
              gateway: PaymentGateway.STRIPE,
              gatewaySubscriptionId: resource.subscription,
            },
          })
        : null);
    if (workspace) {
      await setWorkspaceSubscriptionStatus({
        gateway: PaymentGateway.STRIPE,
        workspaceId: workspace.id,
        status: subscriptionStatus("past_due"),
      });
    }
  }

  await completeBillingEvent(event.id, PaymentGateway.STRIPE);
  return NextResponse.json({ received: true });
}
