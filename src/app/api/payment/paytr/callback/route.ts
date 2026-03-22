import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { examPurchase, prisma } from "@/src/lib/prisma";
import { sendExamPurchaseEmail, sendLiveClassPurchaseEmail } from "@/src/lib/mail";

function createCallbackHash(merchantOid: string, status: string, totalAmount: string): string {
  const merchantKey = process.env.PAYTR_MERCHANT_KEY;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT;

  if (!merchantKey || !merchantSalt) {
    throw new Error("PAYTR credentials not configured");
  }

  return crypto
    .createHmac("sha256", merchantKey)
    .update(`${merchantOid}${merchantSalt}${status}${totalAmount}`)
    .digest("base64");
}

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, "base64");
    const bBuf = Buffer.from(b, "base64");
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
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

  // Always verify hash — reject if credentials missing or hash mismatch
  let expectedHash: string;
  try {
    expectedHash = createCallbackHash(merchantOid, status, totalAmount);
  } catch {
    return textResponse("PAYTR notification failed", 500);
  }

  if (!hash || !timingSafeEqual(expectedHash, hash)) {
    return textResponse("PAYTR notification failed", 400);
  }

  if (merchantOid.startsWith("sub")) {
    const subscriptionId = merchantOid.slice(3);
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

  if (merchantOid.startsWith("livep")) {
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

    // Send confirmation email on successful purchase
    if (status === "success") {
      const purchase = await prisma.liveClassPurchase
        .findFirst({
          where: { referenceId: merchantOid },
          include: {
            liveClass: {
              select: {
                title: true,
                scheduledAt: true,
                durationMinutes: true,
                meetingLink: true,
                topicOutline: true,
              },
            },
          },
        })
        .catch(() => null);

      if (purchase?.liveClass) {
        await sendLiveClassPurchaseEmail({
          to: purchase.email,
          fullName: purchase.fullName,
          classTitle: purchase.liveClass.title,
          scheduledAt: purchase.liveClass.scheduledAt,
          durationMinutes: purchase.liveClass.durationMinutes,
          meetingLink: purchase.liveClass.meetingLink,
          topicOutline: purchase.liveClass.topicOutline,
        }).catch((err) => console.error("[mail] Failed to send live class email:", err));
      }
    }
  }

  if (merchantOid.startsWith("examp")) {
    const nextStatus = status === "success" ? "PAID" : "FAILED";
    await examPurchase
      .updateMany({
        where: { referenceId: merchantOid },
        data: {
          status: nextStatus,
          providerMessage: status === "success" ? "PayTR callback success" : failedReasonMsg || failedReasonCode || "PayTR callback failed",
          ...(status === "success" ? { paidAt: new Date() } : {}),
        },
      })
      .catch(() => null);

    if (status === "success") {
      const purchase = await examPurchase
        .findFirst({
          where: { referenceId: merchantOid },
          include: { examModule: true },
        })
        .catch(() => null);

      if (purchase?.examModule) {
        await sendExamPurchaseEmail({
          to: purchase.email,
          fullName: purchase.fullName,
          examTitle: purchase.examModule.title,
          examType: purchase.examModule.examType,
          questionCount: purchase.examModule.questionCount,
          durationMinutes: purchase.examModule.durationMinutes,
          price: purchase.amount,
          loginUrl: `${process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/exam`,
        }).catch((err) => console.error("[mail] Failed to send exam email:", err));
      }
    }
  }

  if (merchantOid.startsWith("revp")) {
    const nextPaymentStatus = status === "success" ? "PAID" : "FAILED";

    const payment = await prisma.examReviewPayment.findUnique({
      where: { providerPaymentId: merchantOid },
      select: { id: true, bookingId: true },
    }).catch(() => null);

    await prisma.examReviewPayment.updateMany({
      where: { providerPaymentId: merchantOid },
      data: {
        status: nextPaymentStatus,
        providerMessage: status === "success" ? "PayTR callback success" : failedReasonMsg || failedReasonCode || "PayTR callback failed",
        ...(status === "success" ? { paidAt: new Date() } : {}),
      },
    }).catch(() => null);

    if (payment?.bookingId) {
      await prisma.examReviewBooking.update({
        where: { id: payment.bookingId },
        data: {
          status: status === "success" ? "PAID" : "PENDING_PAYMENT",
        },
      }).catch(() => null);
    }
  }

  if (merchantOid.startsWith("lead") && status !== "success") {
    console.error("PayTR lead payment failed", {
      merchantOid,
      failedReasonCode,
      failedReasonMsg,
    });
  }

  return textResponse("OK");
}
