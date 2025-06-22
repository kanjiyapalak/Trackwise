let lastUrl = location.href;

new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log("URL changed: ", currentUrl);
    chrome.runtime.sendMessage({ type: "URL_CHANGED", url: currentUrl });
  }
}).observe(document, { subtree: true, childList: true });
