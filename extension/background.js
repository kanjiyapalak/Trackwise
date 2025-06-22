let activeTabId = null;
let activeTabStartTime = null;
let activeTabDomain = null;
let isWindowFocused = true;

const API_BASE_URL = 'http://localhost:5000/api';

const productiveSites = [
  "leetcode.com", "github.com", "stackoverflow.com", "w3schools.com",
  "chat.openai.com", "coursera.org", "udemy.com", "khanacademy.org",
  "medium.com", "geeksforgeeks.org", "educative.io", "hackerrank.com",
  "codecademy.com", "edx.org", "notion.so", "readthedocs.io",
  "codechef.com", "codeforces.com", "atcoder.jp", "vjudge.net",
  "brilliant.org", "projecteuler.net", "topcoder.com", "exercism.org",
  "interviewbit.com", "slack.com", "zoom.us", "meet.google.com",
  "teams.microsoft.com", "linkedin.com", "openai.com", "chatgpt.com"
];

// Extract domain
function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

// Check productivity
function isProductive(domain) {
  return domain && productiveSites.some(site =>
    domain.toLowerCase().endsWith(site.toLowerCase())
  );
}

// Save time for current tab
async function saveActiveTabTime() {
  if (!activeTabDomain || !activeTabStartTime) return;

  const currentTime = Date.now();
  const timeSpentSeconds = Math.floor((currentTime - activeTabStartTime) / 1000);
  if (timeSpentSeconds < 1) return;

  const productive = isProductive(activeTabDomain);
  const data = {
    url: `https://${activeTabDomain}`,
    domain: activeTabDomain,
    timeSpent: timeSpentSeconds,
    productive
  };

  console.log(`✅ Pushed: ${activeTabDomain}, ${timeSpentSeconds}s, productive: ${productive}`);

  try {
    // Save to analytics
    await fetch(`${API_BASE_URL}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    // Also send usage to the simple tracker for the extension
    await fetch(`${API_BASE_URL}/limits/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website: activeTabDomain, seconds: timeSpentSeconds })
    });

    // Immediately check if the site should be blocked using the accurate endpoint
    checkSiteLimits(activeTabDomain);

  } catch (error) {
    console.error("❌ Failed to save or check limits:", error);
  }

  // Do not reset startTime here! It will be set fresh when switching to a new tab
  activeTabStartTime = null;
  activeTabDomain = null;
}

// Update when tab is activated
async function updateActiveTab(tabId) {
  await saveActiveTabTime(); // Save old tab time

  activeTabId = tabId;
  activeTabStartTime = null;
  activeTabDomain = null;

  if (tabId && isWindowFocused) {
    chrome.tabs.get(tabId, (tab) => {
      if (tab && tab.url && !tab.url.startsWith('chrome://')) {
        activeTabDomain = getDomain(tab.url);
        activeTabStartTime = Date.now(); // Start fresh
      }
    });
  }
}

// Tab activated
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateActiveTab(activeInfo.tabId);
});

// URL changed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    const domain = getDomain(changeInfo.url);
    // When the URL changes, check the limit status for the new domain
    checkSiteLimits(domain);
  }
});

// Window focus change
chrome.windows.onFocusChanged.addListener((windowId) => {
  isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
  if (!isWindowFocused) {
    saveActiveTabTime(); // User moved away
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) updateActiveTab(tabs[0].id);
    });
  }
});

// Periodic check if Chrome is active
function checkIfChromeIsActive() {
  chrome.windows.getLastFocused({ populate: false }, (window) => {
    if (!window || !window.focused) {
      if (isWindowFocused) {
        isWindowFocused = false;
        saveActiveTabTime();
      }
    } else {
      if (!isWindowFocused) {
        isWindowFocused = true;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) updateActiveTab(tabs[0].id);
        });
      }
    }
  });
}
setInterval(checkIfChromeIsActive, 10000); // every 10 seconds

// Periodic save (30s)
setInterval(() => {
  if (isWindowFocused && activeTabId) saveActiveTabTime();
}, 30000);

// On startup/install
chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) updateActiveTab(tabs[0].id);
  });
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) updateActiveTab(tabs[0].id);
  });
});
chrome.runtime.onSuspend.addListener(() => {
  saveActiveTabTime();
});

// Reusable function to block the current tab
function blockCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && !tabs[0].url.includes('blocked.html')) {
      chrome.tabs.update(tabs[0].id, {
        url: chrome.runtime.getURL('blocked.html') + '?from=' + encodeURIComponent(tabs[0].url)
      });
    }
  });
}

// Check site limits and block if needed
async function checkSiteLimits(domain) {
  if (!domain) return;
  
  try {
    // GET the block status from the new, reliable endpoint
    const res = await fetch(`${API_BASE_URL}/limits/status/${domain}`);
    if (!res.ok) {
      console.error(`Failed to fetch status for ${domain}: ${res.status}`);
      return;
    }
    const { shouldBlock } = await res.json();
    if (shouldBlock) {
      blockCurrentTab();
    }
  } catch (error) {
    console.error(`❌ Failed to check site limits for ${domain}:`, error);
  }
}

// Add site limit checking to tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const domain = getDomain(changeInfo.url);
    checkSiteLimits(domain);
  }
});

// Add periodic site limit checking (every 30 seconds)
setInterval(() => {
  if (isWindowFocused && activeTabId) {
    chrome.tabs.get(activeTabId, (tab) => {
      if (tab && tab.url) {
        const domain = getDomain(tab.url);
        checkSiteLimits(domain);
      }
    });
  }
}, 30000);
