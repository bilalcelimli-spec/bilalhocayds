"use client";

import "@livekit/components-styles";

import { LiveKitRoom, PreJoin, VideoConference, type LocalUserChoices } from "@livekit/components-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

type ConnectionDetails = {
  token: string;
  serverUrl: string;
  role: "host" | "speaker" | "viewer";
};

type ClassroomRoomProps = {
  classId: string;
  title: string;
  displayName: string;
  isWebinarViewer: boolean;
};

type Phase = "prejoin" | "connecting" | "in-room" | "left";

export function ClassroomRoom({ classId, title, displayName, isWebinarViewer }: ClassroomRoomProps) {
  const [phase, setPhase] = useState<Phase>("prejoin");
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [choices, setChoices] = useState<LocalUserChoices | null>(null);
  const hasConnectedRef = useRef(false);
  const t = useTranslations("classroom");
  const connectFailedMessage = t("connectFailed");

  const join = useCallback(
    async (userChoices: LocalUserChoices | null) => {
      setError(null);
      setPhase("connecting");
      try {
        const response = await fetch(`/api/classroom/${classId}/token`, { method: "POST" });
        const data = (await response.json()) as Partial<ConnectionDetails> & { error?: string };
        if (!response.ok || !data.token || !data.serverUrl || !data.role) {
          throw new Error(data.error ?? connectFailedMessage);
        }
        setChoices(userChoices);
        hasConnectedRef.current = false;
        setConnection({ token: data.token, serverUrl: data.serverUrl, role: data.role });
        setPhase("in-room");
      } catch (err) {
        setError(err instanceof Error ? err.message : connectFailedMessage);
        setPhase("prejoin");
      }
    },
    [classId, connectFailedMessage],
  );

  if (phase === "left") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white">
        <h2 className="text-2xl font-black">{t("leftTitle")}</h2>
        <p className="text-sm text-slate-300">{title}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setPhase("prejoin")}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            {t("rejoin")}
          </button>
          <Link
            href="/live-classes"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            {t("backToLiveClasses")}
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "in-room" && connection) {
    const canPublish = connection.role !== "viewer";
    return (
      <div data-lk-theme="default" className="h-[calc(100dvh-8rem)] min-h-[480px] overflow-hidden rounded-3xl border border-white/10">
        <LiveKitRoom
          token={connection.token}
          serverUrl={connection.serverUrl}
          connect
          video={canPublish && choices ? (choices.videoEnabled ? { deviceId: choices.videoDeviceId } : false) : false}
          audio={canPublish && choices ? (choices.audioEnabled ? { deviceId: choices.audioDeviceId } : false) : false}
          onConnected={() => {
            hasConnectedRef.current = true;
          }}
          onDisconnected={() => {
            setConnection(null);
            if (hasConnectedRef.current) {
              setPhase("left");
            } else {
              setError(connectFailedMessage);
              setPhase("prejoin");
            }
          }}
          onError={(err) => {
            if (hasConnectedRef.current) {
              setError(err.message);
              return;
            }
            setConnection(null);
            setError(connectFailedMessage);
            setPhase("prejoin");
          }}
          className="h-full"
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {isWebinarViewer ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white">
          <p className="text-sm text-slate-300">
            {t("webinarInfo")}
          </p>
          <button
            type="button"
            disabled={phase === "connecting"}
            onClick={() => join(null)}
            className="mt-6 rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-60"
          >
            {phase === "connecting" ? t("connecting") : t("joinWebinar")}
          </button>
        </div>
      ) : (
        <div data-lk-theme="default" className="rounded-3xl border border-white/10 p-4">
          <PreJoin
            defaults={{ username: displayName, videoEnabled: true, audioEnabled: true }}
            joinLabel={phase === "connecting" ? t("connecting") : t("joinClass")}
            micLabel={t("microphone")}
            camLabel={t("camera")}
            userLabel={t("yourName")}
            onSubmit={(values) => {
              if (phase !== "connecting") void join(values);
            }}
            onError={(err) => setError(t("deviceError", { message: err.message }))}
          />
        </div>
      )}
    </div>
  );
}
