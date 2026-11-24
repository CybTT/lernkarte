"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "connecting" | "connected" | "not-found";

export default function ExtensionConnectPage() {
  const [status, setStatus] = useState<Status>("connecting");

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
    <main className="flex flex-1 items-center justify-center p-6 min-h-[70vh]">
      <div className="polkadot-card flex flex-col items-center gap-6 p-8 rounded-2xl max-w-md w-full text-center">
        <h1 className="font-display text-3xl font-bold text-white">LernKarte Uzantısı</h1>
        
        {status === "connecting" && (
          <p className="text-sm text-neutral-400 animate-pulse">
            Uzantıya bağlanılıyor…
          </p>
        )}
        {status === "connected" && (
          <div className="flex flex-col gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-300 text-sm">
            <span className="font-bold">Bağlandı ✓</span>
            <span>Bu sekmeyi kapatabilirsin, uzantı artık hesabını kullanabilir.</span>
          </div>
        )}
        {status === "not-found" && (
          <div className="flex flex-col gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-300 text-sm">
            <span className="font-bold">Uzantı Bulunamadı</span>
            <span>
              LernKarte Chrome uzantısının yüklü ve etkin olduğundan emin ol, sonra bu sayfayı yenile.
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
