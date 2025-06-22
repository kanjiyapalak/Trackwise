// Website Goals Logic

// Modal elements
const setWebsiteGoalBtn = document.getElementById('setWebsiteGoalBtn');
const websiteGoalModal = document.getElementById('websiteGoalModal');
const closeWebsiteGoalModal = document.getElementById('closeWebsiteGoalModal');
const websiteGoalForm = document.getElementById('websiteGoalForm');
const goalWebsiteInput = document.getElementById('goalWebsiteInput');
const goalMinutesInput = document.getElementById('goalMinutesInput');
const goalTypeInput = document.getElementById('goalTypeInput');
const websiteGoalsSection = document.getElementById('websiteGoalsSection');

let websiteGoals = [];
let latestAnalytics = null;
let editingGoalId = null;

// Modal open/close
setWebsiteGoalBtn.onclick = () => {
  goalWebsiteInput.value = '';
  goalMinutesInput.value = '';
  goalTypeInput.value = 'daily';
  editingGoalId = null;
  websiteGoalModal.style.display = 'flex';
};
closeWebsiteGoalModal.onclick = () => websiteGoalModal.style.display = 'none';
websiteGoalModal.onclick = (e) => { if (e.target === websiteGoalModal) websiteGoalModal.style.display = 'none'; };

// Add new goal
websiteGoalForm.onsubmit = async function(e) {
  e.preventDefault();
  const website = goalWebsiteInput.value.trim().toLowerCase();
  const minutes = parseInt(goalMinutesInput.value, 10);
  const type = goalTypeInput.value;
  if (!website || !minutes || !type) return;
  try {
    let res;
    if (editingGoalId) {
      res = await fetch(`/api/goals/${editingGoalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website, minutes, type })
      });
    } else {
      res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website, minutes, type })
      });
    }
    if (res.ok) {
      websiteGoalModal.style.display = 'none';
      editingGoalId = null;
      await fetchAndRenderWebsiteGoals();
    }
  } catch (err) {
    alert('Failed to save goal');
  }
};

// Fetch all goals
async function fetchAndRenderWebsiteGoals() {
  try {
    const res = await fetch('/api/goals');
    websiteGoals = await res.json();
    renderWebsiteGoals();
  } catch (err) {
    websiteGoalsSection.style.display = 'none';
  }
}

// Delete a goal
async function deleteWebsiteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  try {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    await fetchAndRenderWebsiteGoals();
  } catch (err) {
    alert('Failed to delete goal');
  }
}

// Render all website goals
function renderWebsiteGoals() {
  if (!websiteGoals.length) {
    websiteGoalsSection.style.display = 'none';
    return;
  }
  websiteGoalsSection.style.display = 'block';
  let html = '<h2 style="margin-bottom:1rem;font-size:1.1rem;">Website Goals</h2>';
  html += '<div style="display:flex;flex-direction:column;gap:1.2rem;">';
  for (const goal of websiteGoals) {
    if (goal.type !== (latestAnalytics?.range || 'daily')) continue;
    const { website, minutes, type, _id } = goal;
    // Find time spent for this website in analytics
    let spentSeconds = 0;
    if (latestAnalytics && latestAnalytics.range === type) {
      const prodSites = latestAnalytics.productiveSites || {};
      spentSeconds = prodSites[website] || 0;
    }
    const goalSeconds = minutes * 60;
    const percent = Math.min(100, Math.round((spentSeconds / goalSeconds) * 100));
    const met = spentSeconds >= goalSeconds;
    const timeLeft = met ? 0 : goalSeconds - spentSeconds;
    html += `
      <div style="background:var(--card-bg);border-radius:16px;padding:1.2rem 1.5rem;box-shadow:var(--shadow);position:relative;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;">
          <div style="font-weight:600;font-size:1.05rem;color:var(--primary);">${website}</div>
          <div>
            <button onclick="updateWebsiteGoal('${website}','${minutes}','${type}','${_id}')" style="background:var(--glass-bg);color:var(--primary);border:1px solid var(--border);border-radius:8px;padding:0.4rem 0.9rem;font-size:1rem;cursor:pointer;margin-right:0.5rem;">Update</button>
            <button onclick="deleteWebsiteGoal('${_id}')" style="background:none;border:none;color:var(--accent);font-size:1.2rem;cursor:pointer;">✕</button>
          </div>
        </div>
        <div style="margin:0.5rem 0 0.7rem 0;color:var(--text-light);font-size:0.97rem;">
          Goal: <b>${minutes} min</b> <span style="color:var(--secondary);font-weight:500;">(${type})</span>
        </div>
        <div style="background:var(--glass-bg);border-radius:12px;overflow:hidden;height:24px;box-shadow:0 2px 8px rgba(96,165,250,0.07);margin-bottom:0.3rem;">
          <div style="height:100%;width:${percent}%;background:linear-gradient(90deg,var(--primary),var(--secondary));transition:width 0.5s;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1rem;${met ? 'box-shadow:0 0 12px 2px var(--primary-light);' : ''}">
            ${percent}%
          </div>
        </div>
        <div style="margin-top:0.2rem;text-align:right;color:${met ? 'var(--success)' : 'var(--text-light)'};font-weight:600;">
          ${met ? '🎉 Goal completed!' : `Time left: ${formatTime(timeLeft)}`}
        </div>
      </div>
    `;
  }
  html += '</div>';
  websiteGoalsSection.innerHTML = html;
}

// Helper: format time (reuse from global if available)
function formatTime(seconds) {
  seconds = Math.round(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// Expose delete function globally for inline onclick
window.deleteWebsiteGoal = deleteWebsiteGoal;

// Listen for analytics data from dashboard.js
window.updateWebsiteGoalsProgress = function(analytics, range) {
  latestAnalytics = { ...analytics, range };
  renderWebsiteGoals();
};

// Add this function globally
window.updateWebsiteGoal = function(website, minutes, type, id) {
  goalWebsiteInput.value = website;
  goalMinutesInput.value = minutes;
  goalTypeInput.value = type;
  editingGoalId = id || null;
  websiteGoalModal.style.display = 'flex';
};

// Initial fetch
fetchAndRenderWebsiteGoals(); 