// ─── URL / DB helpers ─────────────────────────────────────────────────────────

const fullUrl = location.href;

let customTitle = null;
let observer = null;

let customFaviconDataUrl = null;
let faviconObserver = null;
let originalFaviconHref = null;

// ─── Title enforcement ────────────────────────────────────────────────────────

function applyTitle(title) {
  document.title = title;
}

// Observe only the <title> element — narrow and safe.
// Watching document.documentElement with subtree:true + characterData:true
// causes an infinite loop: setting document.title triggers a DOM mutation,
// which fires the observer, which sets document.title again, etc.
function startObserver() {
  if (observer) return;
  const titleElement = document.querySelector("title");
  if (!titleElement) return;
  observer = new MutationObserver(() => {
    if (customTitle && document.title !== customTitle) {
      document.title = customTitle;
    }
  });
  observer.observe(titleElement, { childList: true });
}

// ─── Favicon enforcement ──────────────────────────────────────────────────────

function applyCustomFavicon(dataUrl) {
  customFaviconDataUrl = dataUrl;
  if (originalFaviconHref === null) {
    const existing = document.querySelector("link[rel~='icon']");
    originalFaviconHref = existing ? existing.href : "";
  }
  document.querySelectorAll("link[rel~='icon']").forEach(el => el.remove());
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = dataUrl;
  document.head.appendChild(link);
}

function startFaviconObserver() {
  if (faviconObserver) return;
  faviconObserver = new MutationObserver(() => {
    if (!customFaviconDataUrl) return;
    const current = document.querySelectorAll("link[rel~='icon']");
    const isOnlyOurs = current.length === 1 && current[0].href === customFaviconDataUrl;
    if (isOnlyOurs) return;
    faviconObserver.disconnect();
    applyCustomFavicon(customFaviconDataUrl);
    faviconObserver.observe(document.head, { childList: true });
  });
  faviconObserver.observe(document.head, { childList: true });
}

function resetCustomFavicon() {
  customFaviconDataUrl = null;
  if (faviconObserver) {
    faviconObserver.disconnect();
    faviconObserver = null;
  }
  document.querySelectorAll("link[rel~='icon']").forEach(el => el.remove());
  if (originalFaviconHref) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = originalFaviconHref;
    document.head.appendChild(link);
  }
  originalFaviconHref = null;
}

// ─── Matching logic (mirrors background.js) ──────────────────────────────────

function extractDbTableFromUrl(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl);
    const params = parsedUrl.searchParams;
    const db = params.get("db") || params.get("database");
    const table = params.get("table") || params.get("tablename");
    if (db) return { db, table: table || null, host: parsedUrl.host };
  } catch (e) { }
  return null;
}

function findMatchingEntry(url, storageData) {
  const dbInfo = extractDbTableFromUrl(url);

  // 1. Exact URL
  if (storageData[url]) {
    const entry = storageData[url];
    if (typeof entry === "string") return { name: entry };
    if (entry.name || entry.icon) return entry;
  }

  // 2. Regex
  for (const [storedUrl, entry] of Object.entries(storageData)) {
    if (storedUrl === "language" || storedUrl === url) continue;
    if (typeof entry !== "object" || !entry || entry.mode === "db") continue;
    const isRegex = entry.matchType === "regex" || entry.isRegex === true;
    if (!isRegex || (!entry.name && !entry.icon)) continue;
    try {
      if (new RegExp(storedUrl).test(url)) return entry;
    } catch (e) { }
  }

  // 3. DB mode
  if (dbInfo) {
    for (const [, entry] of Object.entries(storageData)) {
      if (!entry || typeof entry !== "object") continue;
      if (entry.mode !== "db" || !entry.db) continue;
      const hostMatches = !entry.host || entry.host === dbInfo.host;
      if (!hostMatches || entry.db !== dbInfo.db) continue;
      if (dbInfo.table) {
        if (entry.table && entry.table === dbInfo.table) return entry;
      } else {
        if (!entry.table) return entry;
      }
    }
  }

  // 4. Prefix
  for (const [storedUrl, entry] of Object.entries(storageData)) {
    if (storedUrl === "language" || storedUrl === url) continue;
    if (typeof entry === "object" && entry.mode === "db") continue;
    if (typeof entry === "string") continue;
    if (!entry || (!entry.name && !entry.icon)) continue;
    if (entry.isRegex === true) continue;
    if ((entry.matchType || "exact") === "prefix" && url.startsWith(storedUrl)) return entry;
  }

  return null;
}

// ─── Initial load ─────────────────────────────────────────────────────────────
// Read sync storage only — local storage is no longer used as a title cache.
// (Writing to local on rename + not clearing it on reset was the root cause
// of the ghost-entry crash introduced in earlier versions.)

chrome.storage.sync.get(null, (syncData) => {
  const entry = findMatchingEntry(fullUrl, syncData);
  if (!entry) return;
  if (entry.name) {
    customTitle = entry.name;
    applyTitle(customTitle);
    startObserver();
  }
  if (entry.icon) {
    applyCustomFavicon(entry.icon);
    startFaviconObserver();
  }
});

// ─── Messages from popup / background ────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTitle") {
    sendResponse({ title: customTitle || document.title });
    return;
  }

  if (message.action === "rename") {
    customTitle = message.title;
    applyTitle(customTitle);
    startObserver();
    return;
  }

  if (message.action === "reset") {
    customTitle = null;
    // Also purge any legacy local-storage ghost entries from older versions.
    const legacyKey = location.origin + location.pathname;
    chrome.storage.local.remove(legacyKey);
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    return;
  }

  if (message.action === "setFavicon") {
    applyCustomFavicon(message.faviconDataUrl);
    startFaviconObserver();
    return;
  }

  if (message.action === "resetFavicon") {
    resetCustomFavicon();
    return;
  }
});
