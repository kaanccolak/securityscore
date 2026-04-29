import crypto from "node:crypto";

const IYZICO_BASE = process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com";

export interface CheckoutPayload {
  locale: string;
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: string;
  basketId: string;
  paymentGroup: string;
  callbackUrl: string;
  enabledInstallments: number[];
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    city: string;
    country: string;
    ip: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: string;
    price: string;
  }>;
}

function randomKey(): string {
  return crypto.randomBytes(16).toString("hex");
}

function signRequest(body: string, secretKey: string): string {
  return crypto
    .createHmac("sha256", secretKey)
    .update(body)
    .digest("base64");
}

/**
 * Initializes iyzico checkout form (server-side).
 * Requires IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL.
 */
export async function initializeCheckoutForm(payload: CheckoutPayload): Promise<{
  status: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  errorMessage?: string;
}> {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  if (!apiKey || !secretKey) {
    return {
      status: "failure",
      errorMessage: "iyzico anahtarları yapılandırılmadı",
    };
  }

  const body = JSON.stringify(payload);
  const rnd = randomKey();
  const authorization = signRequest(`${apiKey}${rnd}${secretKey}${body}`, secretKey);
  const authorizationHeader = `IYZWSv2 ${authorization}`;

  const res = await fetch(`${IYZICO_BASE}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authorizationHeader,
      "x-iyzi-rnd": rnd,
    },
    body,
  });

  const json = (await res.json()) as {
    status: string;
    checkoutFormContent?: string;
    paymentPageUrl?: string;
    errorMessage?: string;
  };
  return json;
}

/**
 * Verifies iyzico webhook / notification HMAC (v2 style).
 * Incoming header often: `iyzi-signature` = base64 HMAC of message with secret.
 */
export function verifyIyzicoSignature(
  secretKey: string,
  message: string,
  signatureB64: string,
): boolean {
  const expected = crypto.createHmac("sha256", secretKey).update(message).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureB64));
  } catch {
    return false;
  }
}
