import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

function createCallbackHash(merchantOid: string, status: string, totalAmount: string) {
  const merchantKey = process.env.PAYTR_MERCHANT_KEY;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT;

  if (!merchantKey || !merchantSalt) {
    return null;
  }

  return crypto
    .createHmac("sha256", merchantKey)
    .update(`${merchantOid}${merchantSalt}${status}${totalAmount}`)
    .digest("base64");
}

function textResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const merchantOid = String(formData.get("merchant_oid") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const totalAmount = String(formData.get("total_amount") ?? "").trim();
  const hash = String(formData.get("hash") ?? "").trim();
  const failedReasonCode = String(formData.get("failed_reason_code") ?? "").trim();
  const failedReasonMsg = String(formData.get("failed_reason_msg") ?? "").trim();

  if (!merchantOid || !status) {
    return textResponse("PAYTR notification failed", 400);
  }

  const expectedHash = createCallbackHash(merchantOid, status, totalAmount);
  if (expectedHash && hash && expectedHash !== hash) {
    return textResponse("PAYTR notification failed", 400);
  }

  if (merchantOid.startsWith("sub:")) {
    const subscriptionId = merchantOid.slice(4);
    const nextStatus = status === "success" ? "ACTIVE" : "PAST_DUE";

    await prisma.subscription
      .update({
        where: { id: subscriptionId },
        data: {
          status: nextStatus,
          ...(status === "success" ? {} : { autoRenew: false }),
        },
      })
      .catch(() => null);
  }

  if (merchantOid.startsWith("livep:")) {
    const nextStatus = status === "success" ? "PAID" : "FAILED";
    await prisma.liveClassPurchase
      .updateMany({
        where: { referenceId: merchantOid },
        data: {
          status: nextStatus,
          providerMessage: status === "success" ? "PayTR callback success" : failedReasonMsg || failedReasonCode || "PayTR callback failed",
          ...(status === "success" ? { paidAt: new Date() } : {}),
        },
      })
      .catch(() => null);
  }

  if (merchantOid.startsWith("lead:") && status !== "success") {
    console.error("PayTR lead payment failed", {
      merchantOid,
      failedReasonCode,
      failedReasonMsg,
    });
  }

  return textResponse("OK");
}
