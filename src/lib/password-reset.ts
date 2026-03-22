import { createHash, randomBytes } from "crypto";

export const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60;

export function generatePasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetExpiry() {
  return new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
}