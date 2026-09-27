import { AccessToken, TrackSource, WebhookReceiver } from "livekit-server-sdk";
import type { VideoGrant } from "livekit-server-sdk";

export type ClassroomRole = "host" | "speaker" | "viewer";

type LiveKitConfig = {
  url: string;
  apiKey: string;
  apiSecret: string;
};

export function getLiveKitConfig(): LiveKitConfig | null {
  const url = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

  if (!url || !apiKey || !apiSecret) {
    return null;
  }

  return { url, apiKey, apiSecret };
}

export function isLiveKitConfigured() {
  return getLiveKitConfig() !== null;
}

export function buildRoomName(liveClassId: string) {
  return `liveclass_${liveClassId}`;
}

function buildGrant(roomName: string, role: ClassroomRole): VideoGrant {
  const base: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublishData: true,
  };

  if (role === "host") {
    return { ...base, roomAdmin: true, roomRecord: true, canPublish: true };
  }

  if (role === "speaker") {
    return {
      ...base,
      canPublish: true,
      canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
    };
  }

  // Webinar izleyicisi: yalnızca izler ve sohbete yazar.
  return { ...base, canPublish: false };
}

export async function createClassroomToken(input: {
  roomName: string;
  identity: string;
  displayName: string;
  role: ClassroomRole;
}) {
  const config = getLiveKitConfig();
  if (!config) {
    throw new Error("LiveKit is not configured");
  }

  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: input.identity,
    name: input.displayName,
    metadata: JSON.stringify({ role: input.role }),
    ttl: "2h",
  });
  token.addGrant(buildGrant(input.roomName, input.role));

  return {
    token: await token.toJwt(),
    serverUrl: config.url,
  };
}

export function getWebhookReceiver() {
  const config = getLiveKitConfig();
  if (!config) {
    return null;
  }

  return new WebhookReceiver(config.apiKey, config.apiSecret);
}
