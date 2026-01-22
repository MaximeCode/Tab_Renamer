// Helper function to find matching title for a URL
function findMatchingTitle(url, storageData) {
  // First, check for exact match
  if (storageData[url]) {
    const entry = storageData[url];
    // Handle both old format (string) and new format (object)
    if (typeof entry === "string") {
      return entry;
    } else if (entry.name) {
      return entry.name;
    }
  }

  // Then, check for prefix matches
  for (const [storedUrl, entry] of Object.entries(storageData)) {
    if (storedUrl === url) continue; // Already checked above

    let matchType = "exact";
    let name = null;

    // Handle both old format (string) and new format (object)
    if (typeof entry === "string") {
      name = entry;
      matchType = "exact";
    } else if (entry && entry.name) {
      name = entry.name;
      matchType = entry.matchType || "exact";
    }

    if (name && matchType === "prefix" && url.startsWith(storedUrl)) {
      return name;
    }
  }

  return null;
}

// Restaurer les titres lors des changements d'onglet ou de navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Attendre que la page soit complètement chargée
  if (changeInfo.status === "complete" && tab.url) {
    const url = tab.url;

    // Get all storage data to check for prefix matches
    chrome.storage.sync.get(null, (result) => {
      const matchingTitle = findMatchingTitle(url, result);
      if (matchingTitle) {
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            func: (title) => {
              document.title = title;
            },
            args: [matchingTitle],
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
    const url = tab.url;
    // Get all storage data to check for prefix matches
    chrome.storage.sync.get(null, (result) => {
      const matchingTitle = findMatchingTitle(url, result);
      if (matchingTitle) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: (title) => {
              document.title = title;
            },
            args: [matchingTitle],
          })
          .catch(() => { });
      }
    });
  }
});
