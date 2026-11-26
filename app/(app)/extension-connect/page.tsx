"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";

type Status = "connecting" | "connected" | "not-found";

export default function ExtensionConnectPage() {
  const [status, setStatus] = useState<Status>("connecting");
  const { t } = useI18n();

  useEffect(() => {
    let acked = false;
    let attempts = 0;

    function onAck(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.source === "lernkarte-extension" && event.data?.type === "ACK") {
        acked = true;
        setStatus(event.data.ok ? "connected" : "not-found");
      }
    }
    window.addEventListener("message", onAck);

    const supabase = createClient();
    const interval = setInterval(async () => {
      if (acked || attempts >= 8) {
        clearInterval(interval);
        if (!acked) setStatus("not-found");
        return;
      }
      attempts += 1;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      window.postMessage(
        {
          source: "lernkarte-web",
          type: "SESSION",
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: { id: session.user.id, email: session.user.email ?? null },
          },
        },
        window.location.origin
      );
    }, 700);

    return () => {
      window.removeEventListener("message", onAck);
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-bold sm:text-5xl">{t.extension.title}</h1>

      {status === "connecting" && <p className="label animate-pulse">{t.extension.connecting}</p>}
      {status === "connected" && (
        <div className="border-l-2 border-good pl-4">
          <p className="hand text-3xl text-good">{t.extension.connected}</p>
          <p className="mt-1 text-muted-text">{t.extension.connectedBody}</p>
        </div>
      )}
      {status === "not-found" && (
        <div className="border-l-2 border-red pl-4">
          <p className="font-semibold text-red">{t.extension.notFound}</p>
          <p className="mt-1 max-w-[56ch] text-muted-text">{t.extension.notFoundBody}</p>
        </div>
      )}
    </main>
  );
}
