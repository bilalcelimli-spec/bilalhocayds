function resolveAppBaseUrl() {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function resolveIframeBaseUrl() {
  return process.env.PAYTR_IFRAME_BASE_URL ?? "";
}

type PaytrCheckoutInput = {
  planName: string;
  amount: number;
  email: string;
  phone: string;
  userId: string;
  referenceId?: string;
};

type PaymentGatewayResponse = Record<string, unknown>;

export type PaytrCheckoutResult = {
  success: boolean;
  provider: "paytr";
  mode: "mock" | "live";
  status: "success" | "failed" | "pending";
  message?: string;
  redirectUrl?: string;
  token?: string;
  orderReference: string;
  raw: PaymentGatewayResponse;
  payload: Record<string, unknown>;
};

function extractFirstString(
  source: PaymentGatewayResponse,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function normalizePaytrResponse(
  response: PaymentGatewayResponse,
  payload: Record<string, unknown>,
  orderReference: string,
): PaytrCheckoutResult {
  const iframeBaseUrl = resolveIframeBaseUrl();
  const token = extractFirstString(response, ["token", "iframe_token", "paytr_token"]);
  const directRedirectUrl = extractFirstString(response, [
    "redirectUrl",
    "redirect_url",
    "payment_url",
    "payment_link",
    "link",
    "url",
  ]);

  const redirectUrl = directRedirectUrl ?? (token && iframeBaseUrl ? `${iframeBaseUrl}${token}` : undefined);
  const statusValue = String(response.status ?? response.result ?? "").toLowerCase();
  const successFlag =
    response.success === true ||
    statusValue === "success" ||
    statusValue === "ok" ||
    Boolean(redirectUrl) ||
    Boolean(token);
  const status: PaytrCheckoutResult["status"] = successFlag
    ? redirectUrl || token
      ? "pending"
      : "success"
    : "failed";

  return {
    success: successFlag,
    provider: "paytr",
    mode: "live",
    status,
    message: extractFirstString(response, ["message", "reason", "error_message", "failed_reason_msg"]),
    redirectUrl,
    token,
    orderReference,
    raw: response,
    payload,
  };
}

export async function paytrCheckout({
  planName,
  amount,
  email,
  phone,
  userId,
  referenceId,
}: PaytrCheckoutInput): Promise<PaytrCheckoutResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  const appBaseUrl = resolveAppBaseUrl();
  const merchantOrderId = referenceId ?? `paytr:${userId}:${Date.now()}`;

  const payload = {
    merchant_id: process.env.PAYTR_MERCHANT_ID,
    merchant_oid: merchantOrderId,
    email,
    amount,
    phone,
    user_id: userId,
    plan_name: planName,
    merchant_ok_url: `${appBaseUrl}/payment/success?merchant_oid=${encodeURIComponent(merchantOrderId)}`,
    merchant_fail_url: `${appBaseUrl}/payment/failure?merchant_oid=${encodeURIComponent(merchantOrderId)}`,
    callback_url: `${appBaseUrl}/api/payment/paytr/callback`,
  };

  if (
    !process.env.PAYTR_MERCHANT_ID ||
    !process.env.PAYTR_MERCHANT_KEY ||
    !process.env.PAYTR_MERCHANT_SALT
  ) {
    return {
      success: true,
      status: "pending",
      mode: "mock",
      provider: "paytr",
      message: "PayTR env ayarlari eksik oldugu icin mock mod calisti.",
      redirectUrl: `${appBaseUrl}/payment/success?merchant_oid=${encodeURIComponent(merchantOrderId)}&mock=1`,
      orderReference: merchantOrderId,
      raw: {},
      payload,
    };
  }

  try {
    const response = await fetch("https://www.paytr.com/odeme/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        merchant_key: process.env.PAYTR_MERCHANT_KEY,
        merchant_salt: process.env.PAYTR_MERCHANT_SALT,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as PaymentGatewayResponse;
    const normalized = normalizePaytrResponse(data, payload, merchantOrderId);

    if (!normalized.success) {
      throw new Error(normalized.message ?? "PayTR olumsuz yanit verdi.");
    }

    return normalized;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error("PayTR payment failed: " + message);
  }
}
