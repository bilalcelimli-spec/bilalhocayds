import crypto from "node:crypto";

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
  userName: string;
  userIp: string;
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
  userName,
  userIp,
  userId,
  referenceId,
}: PaytrCheckoutInput): Promise<PaytrCheckoutResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  const appBaseUrl = resolveAppBaseUrl();
  const iframeBaseUrl = resolveIframeBaseUrl();
  const merchantOrderId = referenceId ?? `paytr:${userId}:${Date.now()}`;
  const merchantId = process.env.PAYTR_MERCHANT_ID ?? "";
  const merchantKey = process.env.PAYTR_MERCHANT_KEY ?? "";
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT ?? "";

  const payload: Record<string, unknown> = {
    merchant_id: merchantId,
    merchant_oid: merchantOrderId,
    email,
    phone,
    user_name: userName,
    user_ip: userIp,
    plan_name: planName,
    merchant_ok_url: `${appBaseUrl}/payment/success?merchant_oid=${encodeURIComponent(merchantOrderId)}`,
    merchant_fail_url: `${appBaseUrl}/payment/failure?merchant_oid=${encodeURIComponent(merchantOrderId)}`,
  };

  if (!merchantId || !merchantKey || !merchantSalt) {
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

  // PayTR kuruş cinsinden ister (TL * 100)
  const paymentAmount = Math.round(amount * 100);
  const userBasket = Buffer.from(
    JSON.stringify([[planName, amount.toFixed(2), 1]])
  ).toString("base64");
  const noInstallment = "0";
  const maxInstallment = "0";
  const currency = "TL";
  const testMode = "0";

  // HMAC-SHA256 token (PayTR zorunlu)
  const hashStr = `${merchantId}${userIp}${merchantOrderId}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}${merchantSalt}`;
  const paytrToken = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr)
    .digest("base64");

  const formBody = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: userIp,
    merchant_oid: merchantOrderId,
    email,
    payment_amount: String(paymentAmount),
    paytr_token: paytrToken,
    user_basket: userBasket,
    no_installment: noInstallment,
    max_installment: maxInstallment,
    currency,
    test_mode: testMode,
    user_name: userName,
    user_address: "Türkiye",
    user_phone: phone,
    merchant_ok_url: `${appBaseUrl}/payment/success?merchant_oid=${encodeURIComponent(merchantOrderId)}`,
    merchant_fail_url: `${appBaseUrl}/payment/failure?merchant_oid=${encodeURIComponent(merchantOrderId)}`,
    lang: "tr",
    debug_on: "0",
  });

  try {
    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as PaymentGatewayResponse;

    if (String(data.status) === "failed") {
      throw new Error(String(data.reason ?? "PayTR token alinamadi."));
    }

    const token = typeof data.token === "string" ? data.token : undefined;
    const redirectUrl = token && iframeBaseUrl ? `${iframeBaseUrl}${token}` : undefined;

    return {
      success: true,
      provider: "paytr",
      mode: "live",
      status: "pending",
      redirectUrl,
      token,
      orderReference: merchantOrderId,
      raw: data,
      payload,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error("PayTR payment failed: " + message);
  }
}
