// Restaurer les titres lors des changements d'onglet ou de navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Attendre que la page soit complètement chargée
  if (changeInfo.status === "complete" && tab.url) {
    const url = tab.url;

    chrome.storage.sync.get([url], (result) => {
      if (result[url]) {
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            func: (title) => {
              document.title = title;
            },
            args: [result[url]],
          })
          .catch(() => {
            // Ignorer les erreurs pour les pages où on ne peut pas injecter de script
          });
      }
    });
  }
});

// Gérer l'activation d'onglet
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);

  if (tab.url) {
    chrome.storage.sync.get([tab.url], (result) => {
      if (result[tab.url]) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: (title) => {
              document.title = title;
            },
            args: [result[tab.url]],
          })
          .catch(() => {});
      }
    });
  }
});
