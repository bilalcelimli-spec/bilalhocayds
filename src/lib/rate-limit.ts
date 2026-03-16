const store = new Map<string, number[]>();

/**
 * Simple in-memory rate limiter for Node.js API routes.
 * Not suitable for Edge runtime or multi-instance deployments without Redis.
 */
export function isRateLimited(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000,
): boolean {
  const now = Date.now();
  const entries = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  entries.push(now);
  store.set(key, entries);
  return entries.length > maxRequests;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
