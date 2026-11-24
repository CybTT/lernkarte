"use strict";
(() => {
  // src/config.ts
  var SUPABASE_URL = "https://bsfaiaifmoaammmenhhq.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZmFpYWlmbW9hYW1tbWVuaGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzc2NzUsImV4cCI6MjEwMzg1MzY3NX0.qTZExw77d2noZh0ljV1S0xTqqtI_bTBH-P-mvBYUDKY";
  var APP_URL = "https://lernkartee.vercel.app";
  var APP_ORIGIN = new URL(APP_URL).origin;

  // src/session.ts
  var KEY = "lernkarte_session";
  async function getSession() {
    const result = await chrome.storage.local.get(KEY);
    return result[KEY] ?? null;
  }
  async function setSession(session) {
    await chrome.storage.local.set({ [KEY]: session });
  }
  async function clearSession() {
    await chrome.storage.local.remove(KEY);
  }

  // src/supabaseRest.ts
  var EXPIRY_SKEW_SECONDS = 30;
  async function refreshSession(refreshToken) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) throw new Error("Session refresh failed");
    const data = await res.json();
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: { id: data.user.id, email: data.user.email ?? null }
    };
    await setSession(session);
    return session;
  }
  async function getValidSession() {
    const session = await getSession();
    if (!session) return null;
    const now = Math.floor(Date.now() / 1e3);
    if (session.expires_at - now > EXPIRY_SKEW_SECONDS) return session;
    try {
      return await refreshSession(session.refresh_token);
    } catch {
      await clearSession();
      return null;
    }
  }
  async function insertWord(input) {
    const session = await getValidSession();
    if (!session) throw new Error("Not authenticated");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/words`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        term: input.term,
        context_sentence: input.context_sentence,
        user_id: session.user.id,
        source: "extension"
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Insert failed: ${res.status} ${text}`);
    }
    const [row] = await res.json();
    return row;
  }
  async function pingEnrich(appUrl, wordId) {
    const session = await getValidSession();
    if (!session) return;
    await fetch(`${appUrl}/api/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ word_ids: [wordId] })
    }).catch(() => {
    });
  }

  // src/background.ts
  var MENU_ID = "lernkarte-add-selection";
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "LernKarte'ye ekle",
      contexts: ["selection"]
    });
  });
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_ID && tab?.id != null) {
      void handleAddSelection(tab.id);
    }
  });
  chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "add-selection" && tab?.id != null) {
      void handleAddSelection(tab.id);
    }
  });
  function isStoredSession(value) {
    const s = value;
    return typeof s?.access_token === "string" && typeof s.refresh_token === "string" && typeof s.expires_at === "number" && typeof s.user?.id === "string";
  }
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "STORE_SESSION") {
      const fromApp = sender.id === chrome.runtime.id && sender.origin === APP_ORIGIN;
      if (!fromApp || !isStoredSession(message.session)) {
        sendResponse({ ok: false });
        return;
      }
      void setSession(message.session).then(() => sendResponse({ ok: true }));
      return true;
    }
  });
  async function toast(tabId, text, tone = "success") {
    await chrome.tabs.sendMessage(tabId, { type: "SHOW_TOAST", text, tone }).catch(() => {
    });
  }
  async function handleAddSelection(tabId) {
    const session = await getValidSession();
    if (!session) {
      await chrome.tabs.create({ url: `${APP_URL}/login?next=/extension-connect` });
      return;
    }
    const payload = await chrome.tabs.sendMessage(tabId, { type: "GET_SELECTION" }).catch(() => null);
    if (!payload) {
      await toast(tabId, "\xD6nce bir kelime se\xE7.", "error");
      return;
    }
    try {
      const word = await insertWord(payload);
      await toast(tabId, `"${payload.term}" LernKarte'ye eklendi \u2713`);
      await pingEnrich(APP_URL, word.id);
    } catch (err) {
      await toast(tabId, `Eklenemedi: ${err.message}`, "error");
    }
  }
})();
