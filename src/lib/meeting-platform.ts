export type MeetingPlatform = "zoom" | "google-meet" | "other" | "none";

export function detectMeetingPlatform(url?: string | null): MeetingPlatform {
  if (!url) return "none";

  const lower = url.toLowerCase();
  if (lower.includes("zoom.us") || lower.includes("zoom.com")) return "zoom";
  if (lower.includes("meet.google.com")) return "google-meet";
  return "other";
}

export function getMeetingPlatformLabel(url?: string | null) {
  const platform = detectMeetingPlatform(url);
  if (platform === "zoom") return "Zoom";
  if (platform === "google-meet") return "Google Meet";
  if (platform === "other") return "Harici Link";
  return "Bağlantı";
}

export function buildZoomDesktopLink(url?: string | null) {
  if (detectMeetingPlatform(url) !== "zoom" || !url) return null;

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const joinIndex = parts.findIndex((part) => part === "j" || part === "join");
    const confno = joinIndex >= 0 ? parts[joinIndex + 1] : null;
    const pwd = parsed.searchParams.get("pwd");

    if (!confno) return null;

    const desktopUrl = new URL("zoommtg://zoom.us/join");
    desktopUrl.searchParams.set("confno", confno);
    if (pwd) {
      desktopUrl.searchParams.set("pwd", pwd);
    }

    return desktopUrl.toString();
  } catch {
    return null;
  }
}