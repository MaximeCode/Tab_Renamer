function extractDbTableFromUrl(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl);
    const params = parsedUrl.searchParams;
    const db = params.get("db") || params.get("database");
    const table = params.get("table") || params.get("tablename");

    if (db) {
      return {
        db,
        table: table || null,
        host: parsedUrl.host,
      };
    }
  } catch (error) {
    // Ignore invalid URLs
  }

  return null;
}

// Helper function to find matching title for a URL
// Priority: 1. Exact URL  2. Regex  3. DB mode  4. Prefix
function findMatchingTitle(url, storageData) {
  const dbInfo = extractDbTableFromUrl(url);

  // 1. Exact URL match
  if (storageData[url]) {
    const entry = storageData[url];
    if (typeof entry === "string") return entry;
    if (entry.name) return entry.name;
  }

  // 2. Regex matches — checked before DB mode so explicit patterns take priority
  for (const [storedUrl, entry] of Object.entries(storageData)) {
    if (storedUrl === "language") continue;
    if (storedUrl === url) continue;
    if (typeof entry !== "object" || !entry) continue;
    if (entry.mode === "db") continue;

    // Support new format (matchType: "regex") and old format (isRegex: true)
    const isRegex = entry.matchType === "regex" || entry.isRegex === true;
    if (!isRegex || !entry.name) continue;

    try {
      const regex = new RegExp(storedUrl);
      if (regex.test(url)) return entry.name;
    } catch (e) {
      // Invalid regex stored, skip
    }
  }

  // 3. DB mode matches
  if (dbInfo) {
    for (const [storedKey, entry] of Object.entries(storageData)) {
      if (storedKey === "language") continue;
      if (!entry || typeof entry !== "object") continue;
      if (entry.mode !== "db" || !entry.db) continue;

      const hostMatches = !entry.host || entry.host === dbInfo.host;
      if (!hostMatches || entry.db !== dbInfo.db) continue;

      if (dbInfo.table) {
        if (entry.table && entry.table === dbInfo.table) return entry.name;
      } else {
        if (!entry.table) return entry.name;
      }
    }
  }

  // 4. Prefix matches
  for (const [storedUrl, entry] of Object.entries(storageData)) {
    if (storedUrl === "language") continue;
    if (storedUrl === url) continue;
    if (typeof entry === "object" && entry.mode === "db") continue;

    let name = null;
    let matchType = "exact";

    if (typeof entry === "string") {
      name = entry;
    } else if (entry && entry.name) {
      name = entry.name;
      matchType = entry.matchType || "exact";
      // Old format compatibility: isRegex entries already handled above
      if (entry.isRegex === true) continue;
    }

    if (name && matchType === "prefix" && url.startsWith(storedUrl)) {
      return name;
    }
  }

  return null;
}

// Applique le titre via sendMessage vers content.js,
// avec executeScript en fallback si content.js n'est pas disponible.
function applyAndPersistTitle(tabId, title) {
  chrome.tabs.sendMessage(tabId, { action: "rename", title }, (response) => {
    if (chrome.runtime.lastError) {
      // content.js ne répond pas (non injecté, ou page restreinte) → fallback executeScript
      chrome.scripting.executeScript({
        target: { tabId },
        func: (customTitle) => {
          const stateKey = "__tabRenamerState";
          const state = window[stateKey] || {};

          if (state.observer) state.observer.disconnect();
          if (state.intervalId) clearInterval(state.intervalId);

          const enforceTitle = () => {
            if (document.title !== customTitle) {
              document.title = customTitle;
            }
          };

          enforceTitle();

          const obs = new MutationObserver(() => enforceTitle());

          obs.observe(document.documentElement, {
            subtree: true,
            childList: true,
            characterData: true,
          });

          const intervalId = setInterval(enforceTitle, 1000);

          window[stateKey] = { customTitle, observer: obs, intervalId };
        },
        args: [title],
      }).catch(() => {
        // Page restreinte (chrome://, extensions, etc.), on ignore silencieusement
      });
    }
  });
}

// Restaurer les titres lors des changements d'onglet ou de navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.storage.sync.get(null, (result) => {
      const matchingTitle = findMatchingTitle(tab.url, result);
      if (matchingTitle) {
        applyAndPersistTitle(tabId, matchingTitle);
      }
    });
  }
});

// Gérer l'activation d'onglet
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (!tab.url) return;

  chrome.storage.sync.get(null, (result) => {
    const matchingTitle = findMatchingTitle(tab.url, result);
    if (matchingTitle) {
      applyAndPersistTitle(tab.id, matchingTitle);
    }
  });
});