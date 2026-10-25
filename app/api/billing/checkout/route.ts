import { NextRequest, NextResponse } from "next/server";
import { CheckoutStatus, PaymentGateway, Plan } from "@prisma/client";
import { rateLimit } from "@/app/lib/api-security";
import { findWorkspaceAccess } from "@/app/lib/billing-access";
import { getPrisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

type CheckoutRequest = {
  gateway?: unknown;
  plan?: unknown;
};

type ProviderCheckout = {
  redirectUrl: string;
  reference: string;
};

class BillingConfigurationError extends Error {}

const planChoices = {
  PRO: {
    stripeAmount: 2900,
    stripePrice: () => process.env.STRIPE_PRO_PRICE_ID,
    paystackPlan: () => process.env.PAYSTACK_PRO_PLAN_CODE,
    paystackAmount: () => process.env.PAYSTACK_PRO_AMOUNT_KOBO,
    flutterwavePlan: () => process.env.FLUTTERWAVE_PRO_PLAN_ID,
    flutterwaveAmount: () => process.env.FLUTTERWAVE_PRO_AMOUNT_NGN,
  },
  BUSINESS: {
    stripeAmount: 9900,
    stripePrice: () => process.env.STRIPE_BUSINESS_PRICE_ID,
    paystackPlan: () => process.env.PAYSTACK_BUSINESS_PLAN_CODE,
    paystackAmount: () => process.env.PAYSTACK_BUSINESS_AMOUNT_KOBO,
    flutterwavePlan: () => process.env.FLUTTERWAVE_BUSINESS_PLAN_ID,
    flutterwaveAmount: () => process.env.FLUTTERWAVE_BUSINESS_AMOUNT_NGN,
  },
} as const;

function configuredAmount(value: string | undefined) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

async function startStripeCheckout(
  plan: keyof typeof planChoices,
  workspaceId: string,
  email: string,
  baseUrl: string,
): Promise<ProviderCheckout> {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = planChoices[plan].stripePrice();
  if (!secret || !price) {
    throw new BillingConfigurationError("Stripe checkout is not fully configured.");
  }

  const priceResponse = await fetch(
    `https://api.stripe.com/v1/prices/${encodeURIComponent(price)}`,
    { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" },
  );
  const configuredPrice = (await priceResponse.json()) as {
    active?: boolean;
    currency?: string;
    unit_amount?: number;
    recurring?: { interval?: string; interval_count?: number };
  };
  if (
    !priceResponse.ok ||
    configuredPrice.active !== true ||
    configuredPrice.currency !== "usd" ||
    configuredPrice.unit_amount !== planChoices[plan].stripeAmount ||
    configuredPrice.recurring?.interval !== "month" ||
    configuredPrice.recurring.interval_count !== 1
  ) {
    throw new BillingConfigurationError(
      `Configure the Stripe ${plan.toLowerCase()} price as $${planChoices[plan].stripeAmount / 100} USD per month.`,
    );
  }

  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    customer_email: email,
    client_reference_id: workspaceId,
    "metadata[workspaceId]": workspaceId,
    "metadata[plan]": plan,
    "subscription_data[metadata][workspaceId]": workspaceId,
    "subscription_data[metadata][plan]": plan,
    success_url: `${baseUrl}/workspace?billing=success`,
    cancel_url: `${baseUrl}/workspace?billing=cancelled`,
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
    cache: "no-store",
  });
  const result = (await response.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !result.id || !result.url) {
    throw new Error(result.error?.message || "Stripe could not start checkout.");
  }
  return { reference: result.id, redirectUrl: result.url };
}

async function startPaystackCheckout(
  plan: keyof typeof planChoices,
  workspaceId: string,
  email: string,
  baseUrl: string,
): Promise<ProviderCheckout> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const planCode = planChoices[plan].paystackPlan();
  const amount = configuredAmount(planChoices[plan].paystackAmount());
  if (!secret || !planCode || !amount) {
    throw new BillingConfigurationError(
      "Paystack plan and NGN amount are not fully configured.",
    );
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: String(amount),
      currency: "NGN",
      plan: planCode,
      callback_url: `${baseUrl}/workspace?billing=return`,
      metadata: { workspaceId, plan },
    }),
    cache: "no-store",
  });
  const result = (await response.json()) as {
    status?: boolean;
    data?: { authorization_url?: string; reference?: string };
    message?: string;
  };
  if (!response.ok || !result.status || !result.data?.authorization_url || !result.data.reference) {
    throw new Error(result.message || "Paystack could not start checkout.");
  }
  return {
    reference: result.data.reference,
    redirectUrl: result.data.authorization_url,
  };
}

async function startFlutterwaveCheckout(
  plan: keyof typeof planChoices,
  workspaceId: string,
  email: string,
  name: string | null,
  baseUrl: string,
): Promise<ProviderCheckout> {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  const planId = Number(planChoices[plan].flutterwavePlan());
  const amount = configuredAmount(planChoices[plan].flutterwaveAmount());
  if (!secret || !Number.isSafeInteger(planId) || planId <= 0 || !amount) {
    throw new BillingConfigurationError(
      "Flutterwave payment plan and NGN amount are not fully configured.",
    );
  }

  const reference = `bg-${crypto.randomUUID()}`;
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: reference,
      amount,
      currency: "NGN",
      payment_plan: planId,
      redirect_url: `${baseUrl}/workspace?billing=return`,
      customer: { email, name: name || email },
      meta: { workspaceId, plan },
      customizations: { title: "Brief Group", description: `${plan} monthly subscription` },
    }),
    cache: "no-store",
  });
  const result = (await response.json()) as {
    status?: string;
    data?: { link?: string };
    message?: string;
  };
  if (!response.ok || result.status !== "success" || !result.data?.link) {
    throw new Error(result.message || "Flutterwave could not start checkout.");
  }
  return { reference, redirectUrl: result.data.link };
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4_096) {
    return NextResponse.json({ error: "Checkout request is too large." }, { status: 413 });
  }

  const limited = await rateLimit(request, "billing-checkout", 8);
  if (limited) return limited;

  const access = await findWorkspaceAccess(request);
  if (access instanceof NextResponse) return access;
  if (access.role !== "OWNER" && access.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only workspace owners and admins can manage billing." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as CheckoutRequest | null;
  if (
    (body?.gateway !== "STRIPE" &&
      body?.gateway !== "PAYSTACK" &&
      body?.gateway !== "FLUTTERWAVE") ||
    (body.plan !== "PRO" && body.plan !== "BUSINESS")
  ) {
    return NextResponse.json(
      { error: "Choose a supported provider and a Pro or Business plan." },
      { status: 400 },
    );
  }

  const gateway = body.gateway as PaymentGateway;
  const plan = body.plan as keyof typeof planChoices;
  const baseUrlValue = process.env.APP_BASE_URL;
  if (!baseUrlValue) {
    return NextResponse.json(
      { error: "APP_BASE_URL must be configured before billing is enabled." },
      { status: 503 },
    );
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(baseUrlValue);
  } catch {
    return NextResponse.json({ error: "APP_BASE_URL is not a valid URL." }, { status: 503 });
  }
  if (
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash ||
    baseUrl.pathname !== "/"
  ) {
    return NextResponse.json({ error: "APP_BASE_URL must be a canonical origin." }, { status: 503 });
  }
  if (baseUrl.protocol !== "https:" && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "APP_BASE_URL must use HTTPS." }, { status: 503 });
  }

  const prisma = getPrisma();
  const attempt = await prisma.checkoutAttempt.create({
    data: {
      workspaceId: access.workspace.id,
      gateway,
      plan: plan as Plan,
    },
  });

  let checkout: ProviderCheckout;
  try {
    if (gateway === "STRIPE") {
      checkout = await startStripeCheckout(
        plan,
        access.workspace.id,
        access.identity.email,
        baseUrl.origin,
      );
    } else if (gateway === "PAYSTACK") {
      checkout = await startPaystackCheckout(
        plan,
        access.workspace.id,
        access.identity.email,
        baseUrl.origin,
      );
    } else {
      checkout = await startFlutterwaveCheckout(
        plan,
        access.workspace.id,
        access.identity.email,
        access.identity.name,
        baseUrl.origin,
      );
    }
  } catch (checkoutError) {
    await prisma.checkoutAttempt.update({
      where: { id: attempt.id },
      data: { status: CheckoutStatus.FAILED },
    });
    const message =
      checkoutError instanceof Error
        ? checkoutError.message
        : "Payment provider could not start checkout.";
    return NextResponse.json(
      { error: message },
      { status: checkoutError instanceof BillingConfigurationError ? 503 : 502 },
    );
  }

  await prisma.checkoutAttempt.update({
    where: { id: attempt.id },
    data: {
      providerReference: checkout.reference,
      checkoutUrl: checkout.redirectUrl,
    },
  });
  return NextResponse.json({ redirectUrl: checkout.redirectUrl });
}
