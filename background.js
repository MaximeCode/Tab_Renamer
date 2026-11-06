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

// ─── Apply helpers ─────────────────────────────────────────────────────────────

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
          document.querySelectorAll("link[rel~='icon']").forEach((el) => el.remove());
          const link = document.createElement("link");
          link.rel = "icon";
          link.href = faviconDataUrl;
          link.dataset.tabRenamer = "1";
          document.head.appendChild(link);
        },
        args: [dataUrl],
      }).catch(() => { });
    }
  });
}

function clearTabFavicon(tabId) {
  chrome.tabs.sendMessage(tabId, { action: "resetFavicon" }, () => {
    void chrome.runtime.lastError;
  });
}

// Apply title: message content.js first, fall back to executeScript.
// Fallback uses a narrow <title> observer + throttle (same as content.js).
function applyAndPersistTitle(tabId, title) {
  chrome.tabs.sendMessage(tabId, { action: "rename", title }, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: (nextTitle) => {
          const stateKey = "__tabRenamerState";
          const prev = window[stateKey];
          if (prev?.observer) prev.observer.disconnect();
          if (prev?.intervalId) clearInterval(prev.intervalId);

          let applying = false;
          let lastApply = 0;
          const throttleMs = 250;

          const apply = () => {
            applying = true;
            lastApply = Date.now();
            document.title = nextTitle;
            queueMicrotask(() => {
              applying = false;
            });
          };
          apply();

          const titleEl = document.querySelector("title");
          const obs = titleEl
            ? new MutationObserver(() => {
              if (applying || document.title === nextTitle) return;
              if (Date.now() - lastApply < throttleMs) return;
              apply();
            })
            : null;
          if (obs) obs.observe(titleEl, { childList: true });

          window[stateKey] = { customTitle: nextTitle, observer: obs, intervalId: null };
        },
        args: [title],
      }).catch(() => { });
    }
  });
}

function clearTabTitle(tabId) {
  chrome.tabs.sendMessage(tabId, { action: "reset" }, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const state = window.__tabRenamerState;
          if (state?.observer) state.observer.disconnect();
          if (state?.intervalId) clearInterval(state.intervalId);
          window.__tabRenamerState = null;
        },
      }).catch(() => { });
    }
  });
}

function syncTab(tabId, url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://") || url.startsWith("edge://")) {
    return;
  }

  // Prefer content.js rematch: it uses live location.href and can clear
  // enforcement when an exact parent rule no longer applies after SPA nav.
  chrome.tabs.sendMessage(tabId, { action: "rematch" }, () => {
    if (!chrome.runtime.lastError) return;

    // Content script unavailable — apply directly via storage + executeScript.
    chrome.storage.sync.get(null, (result) => {
      const entry = findMatchingEntry(url, result);
      if (entry?.name) applyAndPersistTitle(tabId, entry.name);
      else clearTabTitle(tabId);
      if (entry?.icon) applyAndPersistFavicon(tabId, entry.icon);
      else clearTabFavicon(tabId);
    });
  });
}

// ─── Tab event listeners ───────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) return;
  // SPA navigations fire changeInfo.url without a new "complete".
  // Never react to title/favIcon-only updates — that would loop with enforcement.
  if (changeInfo.status === "complete" || changeInfo.url) {
    syncTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url) return;
    syncTab(tab.id, tab.url);
  } catch (e) { }
});
