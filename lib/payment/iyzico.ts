type IyzicoPaymentInput = {
  amount: number;
  userId: string;
  email: string;
};

type PaymentGatewayResponse = Record<string, unknown>;

export async function createIyzicoPayment({ amount, userId, email }: IyzicoPaymentInput): Promise<PaymentGatewayResponse> {
  const payload = {
    api_key: process.env.IYZICO_API_KEY,
    secret_key: process.env.IYZICO_SECRET_KEY,
    email,
    amount,
    user_id: userId,
    // ...other required fields
  };

  if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
    return { success: true, mode: "mock", provider: "iyzico", payload };
  }

  try {
    const response = await fetch("https://api.iyzipay.com/payment", {
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
    throw new Error("iyzico payment failed: " + message);
  }
}
