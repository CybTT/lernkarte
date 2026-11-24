"use strict";
(() => {
  // src/config.ts
  var APP_URL = "https://lernkartee.vercel.app";
  var APP_ORIGIN = new URL(APP_URL).origin;

  // src/auth-bridge.ts
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== APP_ORIGIN) return;
    if (event.data?.source !== "lernkarte-web") return;
    if (event.data.type === "SESSION") {
      chrome.runtime.sendMessage({ type: "STORE_SESSION", session: event.data.session }, (response) => {
        window.postMessage(
          { source: "lernkarte-extension", type: "ACK", ok: Boolean(response?.ok) },
          window.location.origin
        );
      });
    }
  });
})();
