(async function () {
  const url = window.location.href;

  // Récupérer le nom personnalisé depuis le storage
  chrome.storage.sync.get([url], (result) => {
    if (result[url]) {
      document.title = result[url];
    }
  });

  // Écouter les changements dans le storage pour synchroniser
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && changes[url]) {
      if (changes[url].newValue) {
        document.title = changes[url].newValue;
      }
    }
  });

  // Observer les changements de titre (certains sites modifient le titre dynamiquement)
  const observer = new MutationObserver(() => {
    chrome.storage.sync.get([url], (result) => {
      if (result[url] && document.title !== result[url]) {
        document.title = result[url];
      }
    });
  });

  observer.observe(document.querySelector("title"), {
    childList: true,
    characterData: true,
    subtree: true,
  });
})();
