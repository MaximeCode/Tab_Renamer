/* Génère une clé strictement basée sur l'URL */
function getUrlKey() {
  return location.origin + location.pathname;
}

const urlKey = getUrlKey();
const fullUrl = location.href;

let customTitle = null;
let observer = null;

/* Applique le titre */
function applyTitle(title) {
  document.title = title;
}

/* Démarre la surveillance du <title> */
function startObserver() {
  if (observer) return;

  const titleElement = document.querySelector("title");
  if (!titleElement) return;

  observer = new MutationObserver(() => {
    if (customTitle && document.title !== customTitle) {
      document.title = customTitle;
    }
  });

  observer.observe(titleElement, {
    childList: true,
  });
}

/* ── Logique de correspondance (miroir de background.js) ── */

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

function findMatchingTitle(url, storageData) {
  const dbInfo = extractDbTableFromUrl(url);

  // 1. Correspondance exacte
  if (storageData[url]) {
    const entry = storageData[url];
    if (typeof entry === "string") return entry;
    if (entry.name) return entry.name;
  }

  // 2. Regex
  for (const [storedUrl, entry] of Object.entries(storageData)) {
    if (storedUrl === "language") continue;
    if (storedUrl === url) continue;
    if (typeof entry !== "object" || !entry) continue;
    if (entry.mode === "db") continue;

    const isRegex = entry.matchType === "regex" || entry.isRegex === true;
    if (!isRegex || !entry.name) continue;

    try {
      const regex = new RegExp(storedUrl);
      if (regex.test(url)) return entry.name;
    } catch (e) { }
  }

  // 3. Mode DB
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

  // 4. Préfixe
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
      if (entry.isRegex === true) continue;
    }

    if (name && matchType === "prefix" && url.startsWith(storedUrl)) {
      return name;
    }
  }

  return null;
}

/* ── Chargement initial ── */

chrome.storage.local.get(urlKey, (localResult) => {
  if (localResult[urlKey]) {
    // Correspondance exacte trouvée dans le stockage local (mode URL exacte)
    customTitle = localResult[urlKey];
    applyTitle(customTitle);
    startObserver();
  } else {
    // Aucune correspondance exacte : on cherche dans sync (regex, préfixe, DB)
    chrome.storage.sync.get(null, (syncData) => {
      const matched = findMatchingTitle(fullUrl, syncData);
      if (matched) {
        customTitle = matched;
        applyTitle(customTitle);
        startObserver();
      }
    });
  }
});

/* ── Réception des messages du popup ── */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTitle") {
    sendResponse({
      title: customTitle || document.title,
    });
    return;
  }

  if (message.action === "rename") {
    customTitle = message.title;

    chrome.storage.local.set({
      [urlKey]: customTitle,
    });

    applyTitle(customTitle);
    startObserver();
    return;
  }

  if (message.action === "reset") {
    customTitle = null;

    chrome.storage.local.remove(urlKey);

    if (observer) {
      observer.disconnect();
      observer = null;
    }
    return;
  }
});