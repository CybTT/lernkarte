"use strict";
(() => {
  // src/content.ts
  function findContainingBlock(node) {
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const blockTags = /* @__PURE__ */ new Set(["P", "LI", "TD", "DIV", "ARTICLE", "SECTION", "BLOCKQUOTE"]);
    while (el && el.parentElement && !blockTags.has(el.tagName)) {
      el = el.parentElement;
    }
    return el ?? document.body;
  }
  function extractSentence(blockText, term) {
    const idx = blockText.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return null;
    const before = blockText.slice(0, idx);
    const after = blockText.slice(idx + term.length);
    const sentenceEnders = /[.!?][\s"')\]]*$/;
    const lastEnderBefore = Math.max(
      before.lastIndexOf("."),
      before.lastIndexOf("!"),
      before.lastIndexOf("?")
    );
    const start = lastEnderBefore === -1 ? 0 : lastEnderBefore + 1;
    const enderMatch = after.match(/[.!?]/);
    const end = enderMatch ? idx + term.length + (enderMatch.index ?? 0) + 1 : blockText.length;
    const sentence = blockText.slice(start, end).trim();
    return sentenceEnders.test(sentence) || end === blockText.length ? sentence : sentence + ".";
  }
  function getSelectionPayload() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
    const term = selection.toString().trim();
    if (!term || term.split(/\s+/).length > 3) return null;
    const range = selection.getRangeAt(0);
    const block = findContainingBlock(range.commonAncestorContainer);
    const blockText = (block.innerText ?? block.textContent ?? "").replace(/\s+/g, " ").trim();
    return { term, context_sentence: extractSentence(blockText, term) };
  }
  function showToast(message, tone = "success") {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
    background: ${tone === "success" ? "#1f9d55" : "#c0392b"}; color: white;
    padding: 10px 16px; border-radius: 8px; font: 14px system-ui, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25); transition: opacity 0.3s ease;
  `;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 300);
    }, 2200);
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "GET_SELECTION") {
      sendResponse(getSelectionPayload());
      return true;
    }
    if (message?.type === "SHOW_TOAST") {
      showToast(message.text, message.tone);
      return true;
    }
  });
})();
