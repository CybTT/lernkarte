# LernKarte

A German vocabulary trainer for Turkish speakers: add words, let Claude fill in
articles, meanings and examples, then study them with spaced repetition.

Live: https://lernkartee.vercel.app

## Chrome extension (manual install)

The extension lets you select a German word on any web page and add it to your
LernKarte dictionary with a right-click (or `Ctrl+Shift+E` / `Cmd+Shift+E`).
It is not on the Chrome Web Store yet, so install it by hand:

1. Download this repository (**Code → Download ZIP**) and unzip it.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the `extension` folder.
5. Click the LernKarte icon in the toolbar → **Giriş yap**, and sign in on
   lernkartee.vercel.app. The extension connects to your account automatically.

The built files in `extension/dist` are committed, so no build step is needed.
After changing the extension source, rebuild with:

```bash
cd extension && npm install && npm run build
```

## Running locally

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.
