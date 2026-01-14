document.addEventListener("DOMContentLoaded", async () => {
  const tabNameInput = document.getElementById("tabName");
  const renameBtn = document.getElementById("renameBtn");
  const resetBtn = document.getElementById("resetBtn");
  const status = document.getElementById("status");
  const titleText = document.getElementById("titleText");
  const warningText = document.getElementById("warningText");
  const langFrBtn = document.getElementById("langFr");
  const langEnBtn = document.getElementById("langEn");

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

  // Vérifier si un nom personnalisé existe déjà
  chrome.storage.sync.get([url], (result) => {
    if (result[url]) {
      tabNameInput.value = result[url];
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

    // Sauvegarder dans le storage
    chrome.storage.sync.set({ [url]: newName }, () => {
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
    // Supprimer du storage
    chrome.storage.sync.remove([url], () => {
      // Restaurer le titre original save au départ
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (title) => {
          document.title = title;
        },
        args: [baseName],
      });
      showStatus("reset");
      setTimeout(() => window.close(), 1000);
    });
  });

  // Permettre la validation avec Entrée
  tabNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      renameBtn.click();
    }
  });
});
