// ─── Shared matching logic ────────────────────────────────────────────────────
// Single source of truth used by all listeners in this file.

function extractDbTableFromUrl(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl);
    const params = parsedUrl.searchParams;
    const db = params.get("db") || params.get("database");
    const table = params.get("table") || params.get("tablename");
    if (db) {
      return { db, table: table || null, host: parsedUrl.host };
    }
  } catch (e) { }
  return null;
}

// Returns the matching sync entry object (with .name / .icon) or null.
// Priority: 1. Exact URL  2. Regex  3. DB mode  4. Prefix
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
    if ((entry.matchType || "exact") === "prefix" && url.startsWith(storedUrl)) {
      return entry;
    }
  }

  return null;
}

// ─── Apply helpers ─────────────────────────────────────────────────────────────

// Apply favicon: message content.js first, fall back to executeScript.
function applyAndPersistFavicon(tabId, dataUrl) {
  chrome.tabs.sendMessage(tabId, { action: "setFavicon", faviconDataUrl: dataUrl }, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: (faviconDataUrl) => {
          if (window.__tabRenamerFaviconOriginal === undefined) {
            const existing = document.querySelector("link[rel~='icon']");
            window.__tabRenamerFaviconOriginal = existing ? existing.href : "";
          }
          document.querySelectorAll("link[rel~='icon']").forEach(el => el.remove());
          const link = document.createElement("link");
          link.rel = "icon";
          link.href = faviconDataUrl;
          document.head.appendChild(link);
        },
        args: [dataUrl],
      }).catch(() => { });
    }
  });
}

// Apply title: message content.js first, fall back to executeScript.
// FIX: the executeScript fallback previously used a MutationObserver on
// document.documentElement with subtree:true + characterData:true, which
// caused an infinite feedback loop (setting document.title fires a mutation,
// which fires the observer, which sets the title again, ad infinitum).
// The fallback now uses a narrow observer on the <title> element only,
// matching the safe pattern already used in content.js.
function applyAndPersistTitle(tabId, title) {
  chrome.tabs.sendMessage(tabId, { action: "rename", title }, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: (customTitle) => {
          const stateKey = "__tabRenamerState";
          const prev = window[stateKey];
          if (prev?.observer) prev.observer.disconnect();
          if (prev?.intervalId) clearInterval(prev.intervalId);

          document.title = customTitle;

          // Observe only <title> — safe, narrow, no feedback loop.
          const titleEl = document.querySelector("title");
          const obs = titleEl ? new MutationObserver(() => {
            if (document.title !== customTitle) document.title = customTitle;
          }) : null;
          if (obs) obs.observe(titleEl, { childList: true });

          window[stateKey] = { customTitle, observer: obs, intervalId: null };
        },
        args: [title],
      }).catch(() => { });
    }
  });
}

// ─── Tab event listeners ───────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.storage.sync.get(null, (result) => {
      const entry = findMatchingEntry(tab.url, result);
      if (!entry) return;
      if (entry.name) applyAndPersistTitle(tabId, entry.name);
      if (entry.icon) applyAndPersistFavicon(tabId, entry.icon);
    });
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (!tab.url) return;
  chrome.storage.sync.get(null, (result) => {
    const entry = findMatchingEntry(tab.url, result);
    if (!entry) return;
    if (entry.name) applyAndPersistTitle(tab.id, entry.name);
    if (entry.icon) applyAndPersistFavicon(tab.id, entry.icon);
  });
});
