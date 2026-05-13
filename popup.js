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
  const faviconSectionLabel = document.getElementById("faviconSectionLabel");
  const faviconChooseBtn = document.getElementById("faviconChooseBtn");
  const faviconInput = document.getElementById("faviconInput");
  const faviconPreview = document.getElementById("faviconPreview");

  let currentFaviconDataUrl = null;

  // ─── Translations ────────────────────────────────────────────────────────────
  const translations = {
    fr: {
      title: "Renommer cet onglet",
      placeholder: "Entrez le nouveau nom...",
      renameBtn: "Appliquer",
      resetBtn: "Réinitialiser",
      renamed: "✔ Appliqué !",
      reset: "✔ Réinitialisé !",
      matchTypeLabel: "Type de correspondance en fonction de l'URL actuelle :",
      matchExact: "Strictement la même",
      matchPrefix: "Commençant strictement pareil",
      matchRegex: "Regex",
      devModeLabel: "Mode Dev : Base de données",
      dbModeHint: "Analyse l'URL pour associer un nom à une base de données et une table.",
      dbModeMissing: "❌ Mode DB indisponible : base de données ou table introuvable dans l'URL.",
      dbModeWarningNotDb: "Cette page ne semble pas être un outil type phpMyAdmin (pas de db=, table=, etc. dans l'URL). Le mode Dev : DB ne pourra pas être appliqué.",
      regexInvalid: "❌ Expression régulière invalide. Vérifiez la syntaxe.",
      imageInvalid: "❌ Impossible de charger cette image.",
      faviconSectionLabel: "Favicon personnalisé",
      faviconChooseBtn: "Choisir une image…",
    },
    en: {
      title: "Rename this tab",
      placeholder: "Enter new name...",
      renameBtn: "Apply",
      resetBtn: "Reset",
      renamed: "✔ Applied!",
      reset: "✔ Reset!",
      matchTypeLabel: "Match type based on the current URL:",
      matchExact: "Exactly the same",
      matchPrefix: "Starting with exactly the same",
      matchRegex: "Regex",
      devModeLabel: "Dev Mode : Database",
      dbModeHint: "Analyze the URL to associate a name with a database and a table.",
      dbModeMissing: "❌ DB mode unavailable: database or table not found in the URL.",
      dbModeWarningNotDb: "This page doesn't look like a DB admin tool (no db=, table=, etc. in the URL). Dev mode: DB cannot be applied.",
      regexInvalid: "❌ Invalid regular expression. Check the syntax.",
      imageInvalid: "❌ Could not load this image.",
      faviconSectionLabel: "Custom favicon",
      faviconChooseBtn: "Choose an image…",
    },
  };

  // ─── Language ────────────────────────────────────────────────────────────────

  let currentLang = "fr";
  chrome.storage.sync.get(["language"], (result) => {
    if (result.language) currentLang = result.language;
    updateLanguage(currentLang);
  });

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
    faviconSectionLabel.textContent = t.faviconSectionLabel;
    faviconChooseBtn.textContent = t.faviconChooseBtn;
    langFrBtn.classList.toggle("active", lang === "fr");
    langEnBtn.classList.toggle("active", lang === "en");
    chrome.storage.sync.set({ language: lang });
  }

  langFrBtn.addEventListener("click", () => updateLanguage("fr"));
  langEnBtn.addEventListener("click", () => updateLanguage("en"));

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function isValidRegex(pattern) {
    try { new RegExp(pattern); return true; } catch (e) { return false; }
  }

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
      if (db) return { db, table: table || null, host: parsedUrl.host };
    } catch (e) { }
    return null;
  }

  function buildDbKey(dbInfo) {
    return dbInfo.table
      ? `db:${dbInfo.host}:${dbInfo.db}:${dbInfo.table}`
      : `db:${dbInfo.host}:${dbInfo.db}`;
  }

  function setDbModeEnabled(enabled) {
    matchExactRadio.disabled = enabled;
    matchPrefixRadio.disabled = enabled;
    matchRegexRadio.disabled = enabled;
    const opacity = enabled ? "0.5" : "1";
    matchTypeLabel.style.opacity = opacity;
    matchExactLabel.style.opacity = opacity;
    matchPrefixLabel.style.opacity = opacity;
    matchRegexLabel.style.opacity = opacity;
    if (enabled) {
      if (matchRegexRadio.checked || matchPrefixRadio.checked) matchExactRadio.checked = true;
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
    if (show) dbModeWarningText.textContent = translations[currentLang].dbModeWarningNotDb;
  }

  function showFaviconPreview(dataUrl) {
    const ctx = faviconPreview.getContext("2d");
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, 32, 32); ctx.drawImage(img, 0, 0, 32, 32); };
    img.src = dataUrl;
  }

  function resizeToFavicon(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 32;
          canvas.height = 32;
          canvas.getContext("2d").drawImage(img, 0, 0, 32, 32);
          resolve(canvas.toDataURL("image/png"));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function showStatus(messageKey, isError = false) {
    status.textContent = translations[currentLang][messageKey];
    status.classList.remove("success", "error");
    status.classList.add(isError ? "error" : "success");
    setTimeout(() => status.classList.remove("success", "error"), 2500);
  }

  // ─── Matching logic (same priority as background.js / content.js) ─────────────

  function findMatchingEntry(currentUrl, storageData) {
    // 1. Exact URL
    if (storageData[currentUrl]) {
      return { url: currentUrl, entry: storageData[currentUrl] };
    }

    // 2. Regex
    for (const [storedUrl, entry] of Object.entries(storageData)) {
      if (storedUrl === "language" || storedUrl === currentUrl) continue;
      if (typeof entry !== "object" || !entry || entry.mode === "db") continue;
      const isRegex = entry.matchType === "regex" || entry.isRegex === true;
      if (!isRegex || (!entry.name && !entry.icon)) continue;
      try {
        if (new RegExp(storedUrl).test(currentUrl)) return { url: storedUrl, entry };
      } catch (e) { }
    }

    // 3. DB mode
    if (dbInfo) {
      for (const [storedKey, entry] of Object.entries(storageData)) {
        if (storedKey === "language") continue;
        if (!entry || typeof entry !== "object" || entry.mode !== "db" || !entry.db) continue;
        const hostMatches = !entry.host || entry.host === dbInfo.host;
        if (!hostMatches || entry.db !== dbInfo.db) continue;
        if (dbInfo.table ? entry.table === dbInfo.table : !entry.table) {
          return { url: storedKey, entry };
        }
      }
    }

    // 4. Prefix
    for (const [storedUrl, entry] of Object.entries(storageData)) {
      if (storedUrl === "language" || storedUrl === currentUrl) continue;
      if (typeof entry === "object" && entry.mode === "db") continue;
      if (typeof entry !== "object" || !entry || entry.isRegex === true) continue;
      if ((entry.matchType || "exact") === "prefix" && currentUrl.startsWith(storedUrl)) {
        return { url: storedUrl, entry };
      }
    }

    return null;
  }

  // ─── Init: get active tab ────────────────────────────────────────────────────

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const url = tab.url;
  const dbInfo = extractDbTableFromUrl(url);

  matchExactInput.value = url;
  matchPrefixInput.value = url;
  updateInputVisibility();

  // FIX: ask content.js for the real current title rather than using tab.title,
  // which is captured at popup-open time and may be stale on dynamic SPAs.
  // Fall back to tab.title if content.js doesn't respond (restricted pages).
  let originalTitle = tab.title;
  chrome.tabs.sendMessage(tab.id, { action: "getTitle" }, (response) => {
    if (!chrome.runtime.lastError && response?.title) {
      originalTitle = response.title;
    }
  });

  devModeToogle.addEventListener("change", () => {
    setDbModeEnabled(devModeToogle.checked);
    if (devModeToogle.checked && !tabNameInput.value.trim()) {
      tabNameInput.value = dbInfo?.table || dbInfo?.db || "";
    }
    updateDbModeWarning();
  });

  // ─── Pre-fill from stored rule ───────────────────────────────────────────────

  chrome.storage.sync.get(null, (result) => {
    const match = findMatchingEntry(url, result);
    if (match) {
      const { entry, url: storedUrl } = match;
      if (typeof entry === "string") {
        tabNameInput.value = entry;
        matchExactRadio.checked = true;
        setDbModeEnabled(false);
      } else if (entry.name || entry.icon) {
        if (entry.name) tabNameInput.value = entry.name;
        if (entry.icon) {
          currentFaviconDataUrl = entry.icon;
          showFaviconPreview(entry.icon);
        }
        if (entry.mode === "db") {
          devModeToogle.checked = true;
          setDbModeEnabled(true);
        } else {
          setDbModeEnabled(false);
          let matchType = entry.isRegex === true ? "regex" : (entry.matchType || "exact");
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
      devModeToogle.checked = true;
      setDbModeEnabled(true);
      if (!tabNameInput.value.trim()) tabNameInput.value = dbInfo.table || dbInfo.db;
    }
    updateDbModeWarning();
    tabNameInput.select();
  });

  // ─── Apply ───────────────────────────────────────────────────────────────────

  renameBtn.addEventListener("click", async () => {
    const newName = tabNameInput.value.trim() || null;

    if (!newName && !currentFaviconDataUrl) {
      tabNameInput.focus();
      return;
    }

    if (devModeToogle.checked) {
      const dbInfoNow = extractDbTableFromUrl(url);
      if (!dbInfoNow) { showStatus("dbModeMissing", true); return; }

      const dataToSave = {
        name: newName,
        mode: "db",
        db: dbInfoNow.db,
        table: dbInfoNow.table,
        host: dbInfoNow.host,
        icon: currentFaviconDataUrl || null,
      };
      chrome.storage.sync.set({ [buildDbKey(dbInfoNow)]: dataToSave }, () => {
        if (newName) chrome.tabs.sendMessage(tab.id, { action: "rename", title: newName }, () => { void chrome.runtime.lastError; });
        if (currentFaviconDataUrl) chrome.tabs.sendMessage(tab.id, { action: "setFavicon", faviconDataUrl: currentFaviconDataUrl }, () => { void chrome.runtime.lastError; });
        showStatus("renamed");
      });
      return;
    }

    let matchType = "exact";
    if (matchPrefixRadio.checked) matchType = "prefix";
    else if (matchRegexRadio.checked) matchType = "regex";

    let urlToSave;
    if (matchType === "regex") {
      urlToSave = matchRegexInput.value.trim();
      if (!urlToSave) { matchRegexInput.focus(); return; }
      if (!isValidRegex(urlToSave)) { showStatus("regexInvalid", true); return; }
    } else if (matchType === "prefix") {
      urlToSave = matchPrefixInput.value.trim() || url;
    } else {
      urlToSave = matchExactInput.value.trim() || url;
    }

    const dataToSave = { name: newName, matchType, mode: "url", icon: currentFaviconDataUrl || null };
    chrome.storage.sync.set({ [urlToSave]: dataToSave }, () => {
      if (newName) chrome.tabs.sendMessage(tab.id, { action: "rename", title: newName }, () => { void chrome.runtime.lastError; });
      if (currentFaviconDataUrl) chrome.tabs.sendMessage(tab.id, { action: "setFavicon", faviconDataUrl: currentFaviconDataUrl }, () => { void chrome.runtime.lastError; });
      showStatus("renamed");
    });
  });

  // ─── Reset ───────────────────────────────────────────────────────────────────

  // Not async — no await needed here.
  resetBtn.addEventListener("click", () => {
    chrome.storage.sync.get(null, (result) => {
      const cleanup = () => {
        chrome.tabs.sendMessage(tab.id, { action: "reset" }, () => { void chrome.runtime.lastError; });
        chrome.tabs.sendMessage(tab.id, { action: "resetFavicon" }, () => { void chrome.runtime.lastError; });
        // Restore title via executeScript as fallback for restricted pages or
        // when content.js hasn't loaded yet. Uses originalTitle which was
        // refreshed from content.js on popup open (see "getTitle" above).
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (title) => {
            const state = window.__tabRenamerState;
            if (state?.observer) state.observer.disconnect();
            if (state?.intervalId) clearInterval(state.intervalId);
            window.__tabRenamerState = null;
            document.title = title;
          },
          args: [originalTitle],
        }).catch(() => { });
        currentFaviconDataUrl = null;
        faviconPreview.getContext("2d").clearRect(0, 0, 32, 32);
        faviconInput.value = "";
        showStatus("reset");
        setTimeout(() => window.close(), 1000);
      };

      const match = findMatchingEntry(url, result);
      if (match) {
        chrome.storage.sync.remove([match.url], cleanup);
      } else {
        cleanup();
      }
    });
  });

  // ─── Enter key ───────────────────────────────────────────────────────────────

  tabNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") renameBtn.click();
  });

  // ─── Favicon file picker ─────────────────────────────────────────────────────

  faviconInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      currentFaviconDataUrl = await resizeToFavicon(file);
      showFaviconPreview(currentFaviconDataUrl);
    } catch (err) {
      // FIX: was using "regexInvalid" key — now uses the dedicated "imageInvalid" key.
      showStatus("imageInvalid", true);
    }
  });
});
