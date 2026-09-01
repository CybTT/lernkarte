import { APP_URL } from "./config";
import { getValidSession, insertWord, pingEnrich } from "./supabaseRest";
import { setSession, type StoredSession } from "./session";

const MENU_ID = "lernkarte-add-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "LernKarte'ye ekle",
    contexts: ["selection"],
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "STORE_SESSION") {
    void setSession(message.session as StoredSession).then(() => sendResponse({ ok: true }));
    return true; // keep the channel open for the async response
  }
});

async function toast(tabId: number, text: string, tone: "success" | "error" = "success") {
  await chrome.tabs.sendMessage(tabId, { type: "SHOW_TOAST", text, tone }).catch(() => {});
}

async function handleAddSelection(tabId: number) {
  const session = await getValidSession();
  if (!session) {
    await chrome.tabs.create({ url: `${APP_URL}/login?next=/extension-connect` });
    return;
  }

  const payload = await chrome.tabs
    .sendMessage(tabId, { type: "GET_SELECTION" })
    .catch(() => null);

  if (!payload) {
    await toast(tabId, "Önce bir kelime seç.", "error");
    return;
  }

  try {
    const word = await insertWord(payload);
    await toast(tabId, `"${payload.term}" LernKarte'ye eklendi ✓`);
    await pingEnrich(APP_URL, word.id);
  } catch (err) {
    await toast(tabId, `Eklenemedi: ${(err as Error).message}`, "error");
  }
}
