"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>LernKarte uzantısı</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "connecting" && (
            <p className="text-sm text-muted-foreground">Uzantıya bağlanılıyor…</p>
          )}
          {status === "connected" && (
            <p className="text-sm text-article-das">
              Bağlandı ✓ Bu sekmeyi kapatabilirsin, uzantı artık hesabını kullanabilir.
            </p>
          )}
          {status === "not-found" && (
            <p className="text-sm text-article-die">
              Uzantı bulunamadı. LernKarte Chrome uzantısının yüklü ve etkin olduğundan emin ol,
              sonra bu sayfayı yenile.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
