// Runs only on the LernKarte web app's own origin (see manifest.json).
// Relays the logged-in Supabase session from the page to the extension's
// background service worker, so the extension can add words as the same user.

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
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
