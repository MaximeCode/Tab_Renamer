document.addEventListener("DOMContentLoaded", async () => {
  const tabNameInput = document.getElementById("tabName");
  const renameBtn = document.getElementById("renameBtn");
  const resetBtn = document.getElementById("resetBtn");
  const status = document.getElementById("status");
  const titleText = document.getElementById("titleText");
  const warningText = document.getElementById("warningText");
  const langFrBtn = document.getElementById("langFr");
  const langEnBtn = document.getElementById("langEn");
  const matchExactRadio = document.getElementById("matchExact");
  const matchPrefixRadio = document.getElementById("matchPrefix");
  const matchTypeLabel = document.getElementById("matchTypeLabel");
  const matchExactLabel = document.getElementById("matchExactLabel");
  const matchPrefixLabel = document.getElementById("matchPrefixLabel");

  // Translations
  const translations = {
    fr: {
      title: "Renommer cet onglet",
      placeholder: "Entrez le nouveau nom...",
      renameBtn: "Renommer",
      resetBtn: "Réinitialiser",
      warning:
        '⚠️ Attention : le bouton "Réinitialiser" recharge la page.<br />Pensez à sauvegarder votre travail avant d\'utiliser cette option !',
      renamed: "✓ Onglet renommé !",
      reset: "✓ Titre réinitialisé !",
      matchTypeLabel: "Type de correspondance :",
      matchExact: "URL exacte",
      matchPrefix: "URL commence par",
    },
    en: {
      title: "Rename this tab",
      placeholder: "Enter new name...",
      renameBtn: "Rename",
      resetBtn: "Reset",
      warning:
        '⚠️ Warning: the "Reset" button reloads the page.<br />Remember to save your work before using this option!',
      renamed: "✓ Tab renamed!",
      reset: "✓ Title reset!",
      matchTypeLabel: "Match type:",
      matchExact: "Exact URL",
      matchPrefix: "URL starts with",
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
    warningText.innerHTML = t.warning;
    matchTypeLabel.textContent = t.matchTypeLabel;
    matchExactLabel.textContent = t.matchExact;
    matchPrefixLabel.textContent = t.matchPrefix;

    // Update language buttons
    langFrBtn.classList.toggle("active", lang === "fr");
    langEnBtn.classList.toggle("active", lang === "en");

    // Save language preference
    chrome.storage.sync.set({ language: lang });
  }

  // Language switcher handlers
  langFrBtn.addEventListener("click", () => updateLanguage("fr"));
  langEnBtn.addEventListener("click", () => updateLanguage("en"));

  // Récupérer l'onglet actif
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) return;

  const url = tab.url;
  const originalTitle = tab.title; // Store original title for reset

  // Helper function to find matching entry (same as in background.js)
  function findMatchingEntry(currentUrl, storageData) {
    // First, check for exact match
    if (storageData[currentUrl]) {
      return { url: currentUrl, entry: storageData[currentUrl] };
    }

    // Then, check for prefix matches
    for (const [storedUrl, entry] of Object.entries(storageData)) {
      if (storedUrl === currentUrl) continue; // Already checked above

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
      } else if (entry.name) {
        tabNameInput.value = entry.name;
        const matchType = entry.matchType || "exact";
        if (matchType === "prefix") {
          matchPrefixRadio.checked = true;
        } else {
          matchExactRadio.checked = true;
        }
      }
    } else {
      tabNameInput.value = tab.title;
    }
    tabNameInput.select();
  });

  // Fonction pour afficher le statut
  function showStatus(messageKey) {
    const message = translations[currentLang][messageKey];
    status.textContent = message;
    status.classList.add("success");
    setTimeout(() => {
      status.classList.remove("success");
    }, 2000);
  }

  // Renommer l'onglet
  renameBtn.addEventListener("click", async () => {
    const newName = tabNameInput.value.trim();

    if (!newName) {
      tabNameInput.focus();
      return;
    }

    // Get selected match type
    const matchType = matchExactRadio.checked ? "exact" : "prefix";

    // Sauvegarder dans le storage avec le type de correspondance
    const dataToSave = {
      name: newName,
      matchType: matchType,
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
