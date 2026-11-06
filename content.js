// ─── State ────────────────────────────────────────────────────────────────────

let currentUrl = location.href;
let customTitle = null;
let originalTitle = null;
let observer = null;
let applyingTitle = false;
let lastTitleApplyAt = 0;

let customFaviconDataUrl = null;
let faviconObserver = null;
let originalFaviconHref = null;

const TITLE_THROTTLE_MS = 250;

// ─── Title enforcement ────────────────────────────────────────────────────────

function applyTitle(title) {
  applyingTitle = true;
  lastTitleApplyAt = Date.now();
  document.title = title;
  queueMicrotask(() => {
    applyingTitle = false;
  });
}

function stopTitleEnforcement(restoreOriginal) {
  customTitle = null;
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (restoreOriginal && originalTitle !== null) {
    applyTitle(originalTitle);
  }
}

// Observe only the <title> element — narrow and safe.
// Throttle + re-entrancy guard prevent death spirals when the page
// (SPA) keeps rewriting the title against us.
function startObserver() {
  if (observer) return;
  const titleElement = document.querySelector("title");
  if (!titleElement) return;
  observer = new MutationObserver(() => {
    if (applyingTitle || !customTitle) return;
    if (document.title === customTitle) return;
    if (Date.now() - lastTitleApplyAt < TITLE_THROTTLE_MS) return;
    applyTitle(customTitle);
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
  document.querySelectorAll("link[rel~='icon']").forEach((el) => el.remove());
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = dataUrl;
  link.dataset.tabRenamer = "1";
  document.head.appendChild(link);
}

function startFaviconObserver() {
  if (faviconObserver) return;
  faviconObserver = new MutationObserver(() => {
    if (!customFaviconDataUrl) return;
    const current = document.querySelectorAll("link[rel~='icon']");
    const ours = current.length === 1 && current[0].dataset.tabRenamer === "1";
    if (ours) return;
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
  document.querySelectorAll("link[rel~='icon']").forEach((el) => el.remove());
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

// Priority: 1. Exact URL  2. Longest prefix  3. Regex  4. DB mode
function findMatchingEntry(url, storageData) {
  const dbInfo = extractDbTableFromUrl(url);

  // 1. Exact URL — always wins over broader rules
  if (storageData[url]) {
    const entry = storageData[url];
    if (typeof entry === "string") return { name: entry };
    if (entry && (entry.name || entry.icon)) return entry;
  }

  // 2. Longest matching prefix (most specific path wins over a parent prefix)
  let bestPrefix = null;
  let bestPrefixLen = -1;
  for (const [storedUrl, entry] of Object.entries(storageData)) {
    if (storedUrl === "language" || storedUrl === url) continue;
    if (typeof entry !== "object" || !entry || entry.mode === "db") continue;
    if (entry.matchType === "regex" || entry.isRegex === true) continue;
    if (!entry.name && !entry.icon) continue;
    if ((entry.matchType || "exact") !== "prefix") continue;
    if (!url.startsWith(storedUrl)) continue;
    if (storedUrl.length > bestPrefixLen) {
      bestPrefix = entry;
      bestPrefixLen = storedUrl.length;
    }
  }
  if (bestPrefix) return bestPrefix;

  // 3. Regex
  for (const [storedUrl, entry] of Object.entries(storageData)) {
    if (storedUrl === "language" || storedUrl === url) continue;
    if (typeof entry !== "object" || !entry || entry.mode === "db") continue;
    const isRegex = entry.matchType === "regex" || entry.isRegex === true;
    if (!isRegex || (!entry.name && !entry.icon)) continue;
    try {
      if (new RegExp(storedUrl).test(url)) return entry;
    } catch (e) { }
  }

  // 4. DB mode
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

  return null;
}

// ─── Apply / rematch ──────────────────────────────────────────────────────────

function applyEntry(entry) {
  if (entry && entry.name) {
    if (originalTitle === null) originalTitle = document.title;
    customTitle = entry.name;
    applyTitle(customTitle);
    startObserver();
  } else {
    // No rule for this URL (e.g. SPA left an exact parent page): stop
    // fighting the page. Do not restore originalTitle — it may belong to
    // a previous URL. Let the site set its own title freely.
    stopTitleEnforcement(false);
    originalTitle = null;
  }

  if (entry && entry.icon) {
    applyCustomFavicon(entry.icon);
    startFaviconObserver();
  } else if (customFaviconDataUrl) {
    resetCustomFavicon();
  }
}

function rematchFromStorage() {
  chrome.storage.sync.get(null, (syncData) => {
    applyEntry(findMatchingEntry(location.href, syncData));
  });
}

function onUrlMaybeChanged() {
  const next = location.href;
  if (next === currentUrl) return;
  currentUrl = next;
  rematchFromStorage();
}

// popstate / hashchange fire in the content-script world.
window.addEventListener("popstate", onUrlMaybeChanged);
window.addEventListener("hashchange", onUrlMaybeChanged);

// Safety net: SPAs that only touch history in the page world still update
// location.href, which we can poll cheaply from the isolated world.
setInterval(onUrlMaybeChanged, 1000);

// ─── Initial load ─────────────────────────────────────────────────────────────

rematchFromStorage();

// ─── Messages from popup / background ────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTitle") {
    sendResponse({ title: customTitle || document.title });
    return;
  }

  if (message.action === "rename") {
    if (originalTitle === null) originalTitle = document.title;
    currentUrl = location.href;
    customTitle = message.title;
    applyTitle(customTitle);
    startObserver();
    return;
  }

  if (message.action === "rematch") {
    currentUrl = location.href;
    rematchFromStorage();
    return;
  }

  if (message.action === "reset") {
    // Also purge any legacy local-storage ghost entries from older versions.
    const legacyKey = location.origin + location.pathname;
    chrome.storage.local.remove(legacyKey);
    stopTitleEnforcement(true);
    originalTitle = null;
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
