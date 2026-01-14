/* Génère une clé strictement basée sur l’URL */
function getUrlKey() {
  return location.origin + location.pathname;
}

const urlKey = getUrlKey();

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

/* Chargement initial depuis le stockage */
chrome.storage.local.get(urlKey, (result) => {
  if (result[urlKey]) {
    customTitle = result[urlKey];
    applyTitle(customTitle);
    startObserver();
  }
});

/* Réception des messages du popup */
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
