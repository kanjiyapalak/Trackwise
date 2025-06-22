// Focus Mode State
let focusModeEnabled = false;
let timerRunning = false;
let timerInterval = null;
let remainingTime = 0;
let siteLimits = [];

// DOM Elements
const focusModeToggle = document.getElementById('focusModeToggle');
const focusModeContent = document.getElementById('focusModeContent');
const focusTimer = document.getElementById('focusTimer');
const startTimer = document.getElementById('startTimer');
const timerDisplay = document.getElementById('timerDisplay');
const addSiteLimit = document.getElementById('addSiteLimit');

// Load saved settings
chrome.storage.local.get(['focusMode', 'siteLimits'], (result) => {
  focusModeEnabled = result.focusMode || false;
  siteLimits = result.siteLimits || [];
  focusModeToggle.checked = focusModeEnabled;
  updateFocusModeUI();
  renderSiteLimits();
});

// Focus Mode Toggle
focusModeToggle.addEventListener('change', () => {
  focusModeEnabled = focusModeToggle.checked;
  chrome.storage.local.set({ focusMode: focusModeEnabled });
  updateFocusModeUI();
  
  // Notify background script
  chrome.runtime.sendMessage({
    type: 'FOCUS_MODE_CHANGED',
    enabled: focusModeEnabled
  });
});

// Timer Controls
startTimer.addEventListener('click', () => {
  if (timerRunning) {
    stopTimer();
  } else {
    startFocusTimer();
  }
});

function startFocusTimer() {
  const minutes = parseInt(focusTimer.value) || 25;
  remainingTime = minutes * 60;
  timerRunning = true;
  startTimer.textContent = 'Stop Timer';
  timerDisplay.style.display = 'block';
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerDisplay();
    
    if (remainingTime <= 0) {
      stopTimer();
      showNotification('Focus Session Complete!', 'Time to take a break.');
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  startTimer.textContent = 'Start Timer';
  timerDisplay.style.display = 'none';
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Site Limits
addSiteLimit.addEventListener('click', () => {
  const siteInputs = document.querySelectorAll('.site-limit');
  const lastInput = siteInputs[siteInputs.length - 1];
  const website = lastInput.querySelector('.site-input').value.trim();
  const timeLimit = parseInt(lastInput.querySelector('.time-input').value);
  
  if (website && timeLimit) {
    siteLimits.push({ website, timeLimit });
    chrome.storage.local.set({ siteLimits });
    renderSiteLimits();
    
    // Clear inputs
    lastInput.querySelector('.site-input').value = '';
    lastInput.querySelector('.time-input').value = '';
  }
});

function renderSiteLimits() {
  const siteLimitsContainer = document.querySelector('.site-limits');
  const existingLimits = siteLimitsContainer.querySelectorAll('.site-limit');
  existingLimits.forEach(limit => limit.remove());
  
  siteLimits.forEach((limit, index) => {
    const limitDiv = document.createElement('div');
    limitDiv.className = 'site-limit';
    limitDiv.innerHTML = `
      <input type="text" class="site-input" value="${limit.website}" readonly>
      <input type="number" class="time-input" value="${limit.timeLimit}" readonly>
      <button class="remove-limit" data-index="${index}">×</button>
    `;
    siteLimitsContainer.insertBefore(limitDiv, addSiteLimit);
  });
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-limit').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      siteLimits.splice(index, 1);
      chrome.storage.local.set({ siteLimits });
      renderSiteLimits();
    });
  });
}

function updateFocusModeUI() {
  focusModeContent.style.display = focusModeEnabled ? 'block' : 'none';
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: title,
    message: message
  });
} 