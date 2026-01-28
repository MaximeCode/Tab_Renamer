document.addEventListener("DOMContentLoaded", async () => {
  const tabNameInput = document.getElementById("tabName");
  const renameBtn = document.getElementById("renameBtn");
  const resetBtn = document.getElementById("resetBtn");
  const status = document.getElementById("status");
  const titleText = document.getElementById("titleText");
  const langFrBtn = document.getElementById("langFr");
  const langEnBtn = document.getElementById("langEn");
  const matchExactRadio = document.getElementById("matchExact");
  const matchPrefixRadio = document.getElementById("matchPrefix");
  const matchTypeLabel = document.getElementById("matchTypeLabel");
  const matchExactLabel = document.getElementById("matchExactLabel");
  const matchPrefixLabel = document.getElementById("matchPrefixLabel");
  const devModeToogle = document.getElementById("devModeToogle");
  const devModeLabel = document.getElementById("devModeLabel");
  const dbModeHint = document.getElementById("dbModeHint");

  // Récupérer l'onglet actif
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const dbInfo = extractDbTableFromUrl(tab.url);
  console.log(dbInfo);

  // Translations
  const translations = {
    fr: {
      title: "Renommer cet onglet",
      placeholder: "Entrez le nouveau nom...",
      renameBtn: "Renommer",
      resetBtn: "Réinitialiser",
      renamed: "✔ Onglet renommé !",
      reset: "✔ Titre réinitialisé !",
      matchTypeLabel: "Type de correspondance :",
      matchExact: "URL exacte",
      matchPrefix: "URL commence par",
      devModeLabel: "Mode Dev : DB",
      dbModeHint:
        "Analyse l'URL pour associer un nom à une base de données et une table.",
      dbModeMissing:
        "❌ Mode DB indisponible : base de données ou table introuvable dans l'URL.",
    },
    en: {
      title: "Rename this tab",
      placeholder: "Enter new name...",
      renameBtn: "Rename",
      resetBtn: "Reset",
      renamed: "✔ Tab renamed!",
      reset: "✔ Title reset!",
      matchTypeLabel: "Match type:",
      matchExact: "Exact URL",
      matchPrefix: "URL starts with",
      devModeLabel: "Dev Mode : DB",
      dbModeHint:
        "Analyze the URL to associate a name with a database and a table.",
      dbModeMissing:
        "❌ DB mode unavailable: database or table not found in the URL.",
    },
  };

  // Get current language from storage or default to French
  let currentLang = "fr";
  chrome.storage.sync.get(["language"], (result) => {
    if (result.language) {
      currentLang = result.language;
    }
    updateLanguage(currentLang);
  });

  // Update UI with translations
  function updateLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    titleText.textContent = t.title;
    tabNameInput.placeholder = t.placeholder;
    renameBtn.textContent = t.renameBtn;
    resetBtn.textContent = t.resetBtn;
    matchTypeLabel.textContent = t.matchTypeLabel;
    matchExactLabel.textContent = t.matchExact;
    matchPrefixLabel.textContent = t.matchPrefix;
    devModeLabel.textContent = t.devModeLabel;
    dbModeHint.textContent = t.dbModeHint;

    // Update language buttons
    langFrBtn.classList.toggle("active", lang === "fr");
    langEnBtn.classList.toggle("active", lang === "en");

    // Save language preference
    chrome.storage.sync.set({ language: lang });
  }

  // Language switcher handlers
  langFrBtn.addEventListener("click", () => updateLanguage("fr"));
  langEnBtn.addEventListener("click", () => updateLanguage("en"));
  devModeToogle.addEventListener("change", () => {
    setDbModeEnabled(devModeToogle.checked);
    if (!tabNameInput.value.trim()) {
      tabNameInput.value = dbInfo.table;
    }
  });

  if (!tab) return;

  const url = tab.url;
  const originalTitle = tab.title; // Store original title for reset

  function extractDbTableFromUrl(rawUrl) {
    try {
      const parsedUrl = new URL(rawUrl);
      const params = parsedUrl.searchParams;
      const db = params.get("db") || params.get("database");
      const table = params.get("table") || params.get("tablename");

      if (db && table) {
        return {
          db,
          table,
          host: parsedUrl.host,
        };
      }
    } catch (error) {
      // Ignore invalid URLs
    }

    return null;
  }

  function buildDbKey(dbInfo) {
    return `db:${dbInfo.host}:${dbInfo.db}:${dbInfo.table}`;
  }

  function setDbModeEnabled(enabled) {
    matchExactRadio.disabled = enabled;
    matchPrefixRadio.disabled = enabled;
    matchTypeLabel.style.opacity = enabled ? "0.5" : "1";
    matchExactLabel.style.opacity = enabled ? "0.5" : "1";
    matchPrefixLabel.style.opacity = enabled ? "0.5" : "1";
  }

  // Helper function to find matching entry (same Dev-mode logic as in background.js)
  function findMatchingEntry(currentUrl, storageData) {
    // First, check for DB mode matches
    let dbMatch = null;
    let hasAnyDbEntryForDb = false;

    if (dbInfo) {
      for (const [storedKey, entry] of Object.entries(storageData)) {
        if (storedKey === "language") continue;
        if (!entry || typeof entry !== "object") continue;

        if (entry.mode === "db" && entry.db) {
          const hostMatches = !entry.host || entry.host === dbInfo.host;

          if (hostMatches && entry.db === dbInfo.db) {
            hasAnyDbEntryForDb = true;

            // Only a perfect (db + table) match should apply on table URLs
            if (entry.table && entry.table === dbInfo.table) {
              dbMatch = { url: storedKey, entry: entry };
              break;
            }
          }
        }
      }
    }

    if (dbMatch) {
      return dbMatch;
    }

    // Then, check for exact match
    if (storageData[currentUrl]) {
      return { url: currentUrl, entry: storageData[currentUrl] };
    }

    // Dev mode rule:
    // If the URL targets a specific table (dbInfo != null) and there is at least
    // one Dev-mode entry for this DB but none for this table,
    // do NOT fall back to prefix-based renames coming from DB-level URLs.
    if (dbInfo && hasAnyDbEntryForDb && !dbMatch) {
      return null;
    }

    // Then, check for prefix matches
    for (const [storedUrl, entry] of Object.entries(storageData)) {
      if (storedUrl === "language") continue;
      if (storedUrl === currentUrl) continue; // Already checked above

      if (typeof entry === "object" && entry.mode === "db") continue;

      let matchType = "exact";
      if (typeof entry === "object" && entry.matchType) {
        matchType = entry.matchType;
      }

      if (matchType === "prefix" && currentUrl.startsWith(storedUrl)) {
        return { url: storedUrl, entry: entry };
      }
    }

    return null;
  }

  // Vérifier si un nom personnalisé existe déjà
  chrome.storage.sync.get(null, (result) => {
    const match = findMatchingEntry(url, result);
    if (match) {
      const entry = match.entry;
      // Handle both old format (string) and new format (object)
      if (typeof entry === "string") {
        tabNameInput.value = entry;
        matchExactRadio.checked = true; // Default to exact for old entries
        devModeToogle.checked = false;
        setDbModeEnabled(false);
      } else if (entry.name) {
        tabNameInput.value = entry.name;
        if (entry.mode === "db") {
          devModeToogle.checked = true;
          setDbModeEnabled(true);
        } else {
          devModeToogle.checked = false;
          setDbModeEnabled(false);
          const matchType = entry.matchType || "exact";
          if (matchType === "prefix") {
            matchPrefixRadio.checked = true;
          } else {
            matchExactRadio.checked = true;
          }
        }
      }
    }
    tabNameInput.select();
  });

  // Fonction pour afficher le statut
  function showStatus(messageKey, isError = false) {
    const message = translations[currentLang][messageKey];
    status.textContent = message;
    status.classList.remove("success", "error");
    status.classList.add(isError ? "error" : "success");
    setTimeout(() => {
      status.classList.remove("success", "error");
    }, 2500);
  }

  // Renommer l'onglet
  renameBtn.addEventListener("click", async () => {
    const newName = tabNameInput.value.trim();

    if (!newName) {
      tabNameInput.focus();
      return;
    }

    const isDbMode = devModeToogle.checked;

    if (isDbMode) {
      const dbInfo = extractDbTableFromUrl(url);
      if (!dbInfo) {
        showStatus("dbModeMissing", true);
        return;
      }

      const dbKey = buildDbKey(dbInfo);
      const dataToSave = {
        name: newName,
        mode: "db",
        db: dbInfo.db,
        table: dbInfo.table,
        host: dbInfo.host,
      };

      chrome.storage.sync.set({ [dbKey]: dataToSave }, () => {
        // Changer le titre immédiatement
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (title) => {
            document.title = title;
          },
          args: [newName],
        });

        showStatus("renamed");
      });
      return;
    }

    // Get selected match type
    const matchType = matchExactRadio.checked ? "exact" : "prefix";

    // Sauvegarder dans le storage avec le type de correspondance
    const dataToSave = {
      name: newName,
      matchType: matchType,
      mode: "url",
    };

    chrome.storage.sync.set({ [url]: dataToSave }, () => {
      // Changer le titre immédiatement
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (title) => {
          document.title = title;
        },
        args: [newName],
      });

      showStatus("renamed");
    });
  });

  // Réinitialiser le nom
  resetBtn.addEventListener("click", async () => {
    // Find the matching entry (exact or prefix) and remove it
    chrome.storage.sync.get(null, (result) => {
      const match = findMatchingEntry(url, result);
      if (match) {
        // Supprimer l'entrée correspondante du storage
        chrome.storage.sync.remove([match.url], () => {
          // Restaurer le titre original
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (title) => {
              document.title = title;
            },
            args: [originalTitle],
          });
          showStatus("reset");
          setTimeout(() => window.close(), 1000);
        });
      } else {
        // No match found, just close
        showStatus("reset");
        setTimeout(() => window.close(), 1000);
      }
    });
  });

  // Permettre la validation avec Entrée
  tabNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      renameBtn.click();
    }
  });
});
