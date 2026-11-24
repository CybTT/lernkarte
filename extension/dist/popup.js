"use strict";
(() => {
  // src/config.ts
  var APP_URL = "https://lernkartee.vercel.app";
  var APP_ORIGIN = new URL(APP_URL).origin;

  // src/session.ts
  var KEY = "lernkarte_session";
  async function getSession() {
    const result = await chrome.storage.local.get(KEY);
    return result[KEY] ?? null;
  }
  async function clearSession() {
    await chrome.storage.local.remove(KEY);
  }

  // src/popup.ts
  var content = document.getElementById("content");
  async function render() {
    const session = await getSession();
    if (!session) {
      content.innerHTML = "";
      const status2 = document.createElement("div");
      status2.className = "status";
      status2.innerHTML = `<span class="dot off"></span><span>Giri\u015F yap\u0131lmad\u0131</span>`;
      content.appendChild(status2);
      const loginBtn = document.createElement("a");
      loginBtn.className = "button";
      loginBtn.textContent = "Giri\u015F yap";
      loginBtn.href = `${APP_URL}/login?next=/extension-connect`;
      loginBtn.target = "_blank";
      content.appendChild(loginBtn);
      return;
    }
    content.innerHTML = "";
    const status = document.createElement("div");
    status.className = "status";
    const dot = document.createElement("span");
    dot.className = "dot on";
    const label = document.createElement("span");
    label.textContent = session.user.email ?? "Ba\u011Fl\u0131";
    status.append(dot, label);
    content.appendChild(status);
    const p = document.createElement("p");
    p.textContent = "Bir kelime se\xE7ip sa\u011F t\u0131kla veya Ctrl+Shift+E (Cmd+Shift+E) ile ekle.";
    content.appendChild(p);
    const dictBtn = document.createElement("a");
    dictBtn.className = "button";
    dictBtn.textContent = "S\xF6zl\xFC\u011F\xFC a\xE7";
    dictBtn.href = `${APP_URL}/dictionary`;
    dictBtn.target = "_blank";
    content.appendChild(dictBtn);
    const logoutBtn = document.createElement("button");
    logoutBtn.className = "secondary";
    logoutBtn.textContent = "\xC7\u0131k\u0131\u015F yap";
    logoutBtn.onclick = async () => {
      await clearSession();
      render();
    };
    content.appendChild(logoutBtn);
  }
  render();
})();
