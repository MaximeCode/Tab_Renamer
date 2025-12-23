document.addEventListener("DOMContentLoaded", async () => {
  const tabNameInput = document.getElementById("tabName");
  const renameBtn = document.getElementById("renameBtn");
  const resetBtn = document.getElementById("resetBtn");
  const status = document.getElementById("status");

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
  function showStatus(message) {
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

      showStatus("✓ Onglet renommé !");
    });
  });

  // Réinitialiser le nom
  resetBtn.addEventListener("click", async () => {
    // Supprimer du storage
    chrome.storage.sync.remove([url], () => {
      // Recharger la page pour restaurer le titre original
      chrome.tabs.reload(tab.id);
      showStatus("✓ Titre réinitialisé !");
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
