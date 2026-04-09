// Inject the custom title and keep it persistent on dynamic pages
function applyAndPersistTitle(tabId, title) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (customTitle) => {
      const stateKey = "__tabRenamerState";
      const state = window[stateKey] || {};

      if (state.observer) {
        state.observer.disconnect();
      }
      if (state.intervalId) {
        clearInterval(state.intervalId);
      }

      const enforceTitle = () => {
        if (document.title !== customTitle) {
          document.title = customTitle;
        }
      };

      enforceTitle();

      const obs = new MutationObserver(() => {
        enforceTitle();
      });

      obs.observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
      });

      const intervalId = setInterval(enforceTitle, 1000);

      window[stateKey] = {
        customTitle,
        observer: obs,
        intervalId,
      };
    },
    args: [title],
  }).catch(() => { });
}

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
  const matchRegexRadio = document.getElementById("matchRegex");
  const matchTypeLabel = document.getElementById("matchTypeLabel");
  const matchExactLabel = document.getElementById("matchExactLabel");
  const matchPrefixLabel = document.getElementById("matchPrefixLabel");
  const matchRegexLabel = document.getElementById("matchRegexLabel");
  const matchExactInput = document.getElementById("matchExactInput");
  const matchPrefixInput = document.getElementById("matchPrefixInput");
  const matchRegexInput = document.getElementById("matchRegexInput");
  const devModeToogle = document.getElementById("devModeToogle");
  const devModeLabel = document.getElementById("devModeLabel");
  const dbModeHint = document.getElementById("dbModeHint");
  const dbModeWarning = document.getElementById("dbModeWarning");
  const dbModeWarningText = document.getElementById("dbModeWarningText");

  // Translations
  const translations = {
    fr: {
      title: "Renommer cet onglet",
      placeholder: "Entrez le nouveau nom...",
      renameBtn: "Renommer",
      resetBtn: "Réinitialiser",
      renamed: "✔ Onglet renommé !",
      reset: "✔ Titre réinitialisé !",
      currentUrlLabel: "URL actuelle :",
      matchTypeLabel: "Type de correspondance en fonction de l'URL actuelle :",
      matchExact: "Strictement la même",
      matchPrefix: "Commencant strictement pareil",
      matchRegex: "Regex",
      devModeLabel: "Mode Dev : Base de données",
      dbModeHint:
        "Analyse l'URL pour associer un nom à une base de données et une table.",
      dbModeMissing:
        "❌ Mode DB indisponible : base de données ou table introuvable dans l'URL.",
      dbModeWarningNotDb:
        "Cette page ne semble pas être un outil type phpMyAdmin (pas de db=, table=, etc. dans l'URL). Le mode Dev : DB ne pourra pas être appliqué.",
      regexInvalid:
        "❌ Expression régulière invalide. Vérifiez la syntaxe.",
    },
    en: {
      title: "Rename this tab",
      placeholder: "Enter new name...",
      renameBtn: "Rename",
      resetBtn: "Reset",
      renamed: "✔ Tab renamed!",
      reset: "✔ Title reset!",
      currentUrlLabel: "Current URL: ",
      matchTypeLabel: "Match type based on the current URL:",
      matchExact: "Exactly the same",
      matchPrefix: "Starting with exactly the same",
      matchRegex: "Regex",
      devModeLabel: "Dev Mode : Database",
      dbModeHint:
        "Analyze the URL to associate a name with a database and a table.",
      dbModeMissing:
        "❌ DB mode unavailable: database or table not found in the URL.",
      dbModeWarningNotDb:
        "This page doesn't look like a DB admin tool (no db=, table=, etc. in the URL). Dev mode: DB cannot be applied.",
      regexInvalid:
        "❌ Invalid regular expression. Check the syntax.",
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
    matchRegexLabel.textContent = t.matchRegex;
    devModeLabel.textContent = t.devModeLabel;
    dbModeHint.textContent = t.dbModeHint;
    if (dbModeWarning.classList.contains("visible")) {
      dbModeWarningText.textContent = t.dbModeWarningNotDb;
    }

    // Update language buttons
    langFrBtn.classList.toggle("active", lang === "fr");
    langEnBtn.classList.toggle("active", lang === "en");

    // Save language preference
    chrome.storage.sync.set({ language: lang });
  }

  // Language switcher handlers
  langFrBtn.addEventListener("click", () => updateLanguage("fr"));
  langEnBtn.addEventListener("click", () => updateLanguage("en"));

  // Regex validation function
  function isValidRegex(pattern) {
    try {
      new RegExp(pattern);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Show only the input for the selected radio option
  function updateInputVisibility() {
    matchExactInput.type = matchExactRadio.checked ? "text" : "hidden";
    matchPrefixInput.type = matchPrefixRadio.checked ? "text" : "hidden";
    matchRegexInput.type = matchRegexRadio.checked ? "text" : "hidden";
  }

  matchExactRadio.addEventListener("change", updateInputVisibility);
  matchPrefixRadio.addEventListener("change", updateInputVisibility);
  matchRegexRadio.addEventListener("change", updateInputVisibility);

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

  function buildDbKey(dbInfo) {
    if (dbInfo.table) {
      return `db:${dbInfo.host}:${dbInfo.db}:${dbInfo.table}`;
    }
    return `db:${dbInfo.host}:${dbInfo.db}`;
  }

  function setDbModeEnabled(enabled) {
    matchExactRadio.disabled = enabled;
    matchPrefixRadio.disabled = enabled;
    matchRegexRadio.disabled = enabled;
    matchTypeLabel.style.opacity = enabled ? "0.5" : "1";
    matchExactLabel.style.opacity = enabled ? "0.5" : "1";
    matchPrefixLabel.style.opacity = enabled ? "0.5" : "1";
    matchRegexLabel.style.opacity = enabled ? "0.5" : "1";
    // When DB mode is enabled, reset to Exact and hide all sub-inputs
    if (enabled) {
      if (matchRegexRadio.checked || matchPrefixRadio.checked) {
        matchExactRadio.checked = true;
      }
      matchExactInput.type = "hidden";
      matchPrefixInput.type = "hidden";
      matchRegexInput.type = "hidden";
    } else {
      updateInputVisibility();
    }
  }

  function updateDbModeWarning() {
    const show = devModeToogle.checked && !dbInfo;
    dbModeWarning.classList.toggle("visible", show);
    if (show) {
      dbModeWarningText.textContent = translations[currentLang].dbModeWarningNotDb;
    }
  }

  // Récupérer l'onglet actif
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) return;

  const url = tab.url;
  const originalTitle = tab.title; // Store original title for reset
  const dbInfo = extractDbTableFromUrl(url);

  // Pre-fill exact and prefix inputs with the current tab URL
  matchExactInput.value = url;
  matchPrefixInput.value = url;

  // Show only the exact input by default (matchExact is checked by default)
  updateInputVisibility();

  devModeToogle.addEventListener("change", () => {
    setDbModeEnabled(devModeToogle.checked);
    if (devModeToogle.checked && !tabNameInput.value.trim()) {
      if (dbInfo?.table) {
        tabNameInput.value = dbInfo.table;
      } else if (dbInfo?.db) {
        tabNameInput.value = dbInfo.db;
      }
    }
    updateDbModeWarning();
  });

  // Helper function to find matching entry
  // Priority: 1. Exact URL  2. Regex  3. DB mode  4. Prefix
  function findMatchingEntry(currentUrl, storageData) {
    // 1. Exact URL match
    if (storageData[currentUrl]) {
      return { url: currentUrl, entry: storageData[currentUrl] };
    }

    // 2. Regex matches — checked before DB mode so explicit patterns take priority
    for (const [storedUrl, entry] of Object.entries(storageData)) {
      if (storedUrl === "language") continue;
      if (storedUrl === currentUrl) continue;
      if (typeof entry !== "object" || !entry) continue;
      if (entry.mode === "db") continue;

      // Support new format (matchType: "regex") and old format (isRegex: true)
      const isRegex = entry.matchType === "regex" || entry.isRegex === true;
      if (!isRegex || !entry.name) continue;

      try {
        const regex = new RegExp(storedUrl);
        if (regex.test(currentUrl)) {
          return { url: storedUrl, entry: entry };
        }
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
          if (entry.table && entry.table === dbInfo.table) {
            return { url: storedKey, entry: entry };
          }
        } else {
          if (!entry.table) {
            return { url: storedKey, entry: entry };
          }
        }
      }
    }

    // 4. Prefix matches
    for (const [storedUrl, entry] of Object.entries(storageData)) {
      if (storedUrl === "language") continue;
      if (storedUrl === currentUrl) continue;
      if (typeof entry === "object" && entry.mode === "db") continue;

      let matchType = "exact";
      if (typeof entry === "object" && entry.matchType) {
        matchType = entry.matchType;
        // Old format: isRegex entries already handled above
        if (entry.isRegex === true) continue;
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
      const storedUrl = match.url;
      // Handle both old format (string) and new format (object)
      if (typeof entry === "string") {
        tabNameInput.value = entry;
        matchExactRadio.checked = true;
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
          // Support new format (matchType: "regex") and old format (isRegex: true)
          let matchType = entry.matchType || "exact";
          if (entry.isRegex === true) matchType = "regex";

          if (matchType === "regex") {
            matchRegexRadio.checked = true;
            matchRegexInput.value = storedUrl;
          } else if (matchType === "prefix") {
            matchPrefixRadio.checked = true;
            matchPrefixInput.value = storedUrl;
          } else {
            matchExactRadio.checked = true;
            matchExactInput.value = storedUrl;
          }
          updateInputVisibility();
        }
      }
    } else if (dbInfo) {
      // No stored entry but URL has db/table params → pre-check Mode Dev : DB
      devModeToogle.checked = true;
      setDbModeEnabled(true);
      if (!tabNameInput.value.trim()) {
        tabNameInput.value = dbInfo.table || dbInfo.db;
      }
    }
    updateDbModeWarning();
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
        applyAndPersistTitle(tab.id, newName);
        showStatus("renamed");
      });
      return;
    }

    // Get selected match type
    let matchType = "exact";
    if (matchPrefixRadio.checked) {
      matchType = "prefix";
    } else if (matchRegexRadio.checked) {
      matchType = "regex";
    }

    // Get the URL/pattern from the active input
    let urlToSave;
    if (matchType === "regex") {
      urlToSave = matchRegexInput.value.trim();
      if (!urlToSave) {
        matchRegexInput.focus();
        return;
      }
      if (!isValidRegex(urlToSave)) {
        showStatus("regexInvalid", true);
        return;
      }
    } else if (matchType === "prefix") {
      urlToSave = matchPrefixInput.value.trim() || url;
    } else {
      urlToSave = matchExactInput.value.trim() || url;
    }

    // Sauvegarder dans le storage avec le type de correspondance
    const dataToSave = {
      name: newName,
      matchType: matchType,
      mode: "url",
    };

    chrome.storage.sync.set({ [urlToSave]: dataToSave }, () => {
      applyAndPersistTitle(tab.id, newName);
      if (matchType === "regex") {
        let matched = false;
        let regexError = null;
        try {
          matched = new RegExp(urlToSave).test(url);
        } catch (e) {
          regexError = e.message;
        }
      }

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
          // Stop the observer first, then restore the original title
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (title) => {
              const stateKey = "__tabRenamerState";
              const state = window[stateKey];
              if (state?.observer) {
                state.observer.disconnect();
              }
              if (state?.intervalId) {
                clearInterval(state.intervalId);
              }
              window[stateKey] = null;
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
