type PayTRPaymentInput = {
  amount: number;
  userId: string;
  email: string;
};

type PaymentGatewayResponse = Record<string, unknown>;

export async function createPayTRPayment({ amount, userId, email }: PayTRPaymentInput): Promise<PaymentGatewayResponse> {
  const payload = {
    merchant_id: process.env.PAYTR_MERCHANT_ID,
    merchant_key: process.env.PAYTR_MERCHANT_KEY,
    merchant_salt: process.env.PAYTR_MERCHANT_SALT,
    email,
    amount,
    user_id: userId,
  };

  if (
    !process.env.PAYTR_MERCHANT_ID ||
    !process.env.PAYTR_MERCHANT_KEY ||
    !process.env.PAYTR_MERCHANT_SALT
  ) {
    return { success: true, mode: "mock", provider: "paytr", payload };
  }

  try {
    const response = await fetch("https://www.paytr.com/odeme/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as PaymentGatewayResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error("PayTR payment failed: " + message);
  }
}
