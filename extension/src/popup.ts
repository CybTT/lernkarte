import { APP_URL } from "./config";
import { clearSession, getSession } from "./session";

const content = document.getElementById("content")!;

async function render() {
  const session = await getSession();

  if (!session) {
    content.innerHTML = "";
    const status = document.createElement("div");
    status.className = "status";
    status.innerHTML = `<span class="dot off"></span><span>Giriş yapılmadı</span>`;
    content.appendChild(status);

    const loginBtn = document.createElement("a");
    loginBtn.className = "button";
    loginBtn.textContent = "Giriş yap";
    loginBtn.href = `${APP_URL}/login?next=/extension-connect`;
    loginBtn.target = "_blank";
    content.appendChild(loginBtn);
    return;
  }

  content.innerHTML = "";
  const status = document.createElement("div");
  status.className = "status";
  status.innerHTML = `<span class="dot on"></span><span>${session.user.email ?? "Bağlı"}</span>`;
  content.appendChild(status);

  const p = document.createElement("p");
  p.textContent = "Bir kelime seçip sağ tıkla veya Ctrl+Shift+E (Cmd+Shift+E) ile ekle.";
  content.appendChild(p);

  const dictBtn = document.createElement("a");
  dictBtn.className = "button";
  dictBtn.textContent = "Sözlüğü aç";
  dictBtn.href = `${APP_URL}/dictionary`;
  dictBtn.target = "_blank";
  content.appendChild(dictBtn);

  const logoutBtn = document.createElement("button");
  logoutBtn.className = "secondary";
  logoutBtn.textContent = "Çıkış yap";
  logoutBtn.onclick = async () => {
    await clearSession();
    render();
  };
  content.appendChild(logoutBtn);
}

render();
