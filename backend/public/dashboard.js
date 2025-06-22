let charts = {};
let chartData = {
    total: null,
    productive: null,
    unproductive: null
};
let currentRange = 'daily'; // default range

const chartConfig = {
    total: {
        labels: ['Productive', 'Unproductive'],
        colors: ['#4caf50', '#f44336']
    },
    productive: { colors: [] },
    unproductive: { colors: [] }
};

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push('#' + Math.floor(Math.random() * 16777215).toString(16));
    }
    return colors;
}

function destroyChart(chartId) {
    if (charts[chartId]) {
        charts[chartId].destroy();
        charts[chartId] = null;
    }
}

function formatTime(seconds) {
    seconds = Math.round(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function createChart(chartId, type, data, labels, colors) {
    const ctx = document.getElementById(chartId).getContext('2d');
    destroyChart(chartId);

    charts[chartId] = new Chart(ctx, {
        type,
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderColor: type === 'bar' ? colors : undefined,
                borderWidth: type === 'bar' ? 1 : undefined
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${formatTime(ctx.raw)}`
                    }
                }
            },
            scales: type === 'bar' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: val => formatTime(val)
                    }
                }
            } : undefined
        }
    });
}

async function fetchAnalytics(range = 'daily') {
    try {
        const res = await fetch(`http://localhost:5000/api/analytics?range=${range}`);
        const data = await res.json();
        const { totalTime, productiveTime, unproductiveTime, productiveSites, unproductiveSites, topProductiveSites, topUnproductiveSites } = data;

        // Filter out undefined/null/NaN values from total productive/unproductive data
        const totalDataRaw = [productiveTime, unproductiveTime];
        const totalLabelsRaw = chartConfig.total.labels;
        const totalColorsRaw = chartConfig.total.colors;
        const totalFiltered = totalDataRaw
            .map((value, i) => ({ label: totalLabelsRaw[i], value, color: totalColorsRaw[i] }))
            .filter(item => item.value !== undefined && item.value !== null && !isNaN(item.value));
        const filteredTotalData = totalFiltered.map(item => item.value);
        const filteredTotalLabels = totalFiltered.map(item => item.label);
        const filteredTotalColors = totalFiltered.map(item => item.color);
        chartData.total = {
            data: filteredTotalData,
            labels: filteredTotalLabels,
            colors: filteredTotalColors
        };

        const productiveLabels = Object.keys(productiveSites);
        const productiveValues = Object.values(productiveSites);
        // Filter out undefined/null/empty labels and their corresponding data for productive sites
        const productiveFiltered = productiveLabels
            .map((label, i) => ({ label, value: productiveValues[i] }))
            .filter(item => item.label && item.label !== 'undefined' && item.value !== undefined && item.value !== null);
        const filteredProductiveLabels = productiveFiltered.map(item => item.label);
        const filteredProductiveValues = productiveFiltered.map(item => item.value);
        chartConfig.productive.colors = generateColors(filteredProductiveLabels.length);
        chartData.productive = {
            data: filteredProductiveValues,
            labels: filteredProductiveLabels,
            colors: chartConfig.productive.colors
        };

        const unproductiveLabels = Object.keys(unproductiveSites);
        const unproductiveValues = Object.values(unproductiveSites);
        // Filter out undefined/null/empty labels and their corresponding data for unproductive sites
        const unproductiveFiltered = unproductiveLabels
            .map((label, i) => ({ label, value: unproductiveValues[i] }))
            .filter(item => item.label && item.label !== 'undefined' && item.value !== undefined && item.value !== null);
        const filteredUnproductiveLabels = unproductiveFiltered.map(item => item.label);
        const filteredUnproductiveValues = unproductiveFiltered.map(item => item.value);
        chartConfig.unproductive.colors = generateColors(filteredUnproductiveLabels.length);
        chartData.unproductive = {
            data: filteredUnproductiveValues,
            labels: filteredUnproductiveLabels,
            colors: chartConfig.unproductive.colors
        };

        createChart('totalChart', 'pie', chartData.total.data, chartData.total.labels, chartData.total.colors);
        createChart('productiveChart', 'pie', chartData.productive.data, chartData.productive.labels, chartData.productive.colors);
        createChart('unproductiveChart', 'pie', chartData.unproductive.data, chartData.unproductive.labels, chartData.unproductive.colors);

        // Display top 5 productive and unproductive sites with percentage and progress bar
        const topSitesRange = range === 'daily' ? 'Today' : 'This Week';
        document.getElementById('topSitesRange').textContent = topSitesRange;
        document.getElementById('topSitesRange2').textContent = topSitesRange;
        const prodList = document.getElementById('topProductiveSitesList');
        const unprodList = document.getElementById('topUnproductiveSitesList');
        prodList.innerHTML = '';
        unprodList.innerHTML = '';
        const totalProd = Object.values(productiveSites).reduce((a, b) => a + b, 0) || 1;
        (topProductiveSites || []).forEach(([domain, time]) => {
            const percent = ((time / totalProd) * 100).toFixed(1);
            const li = document.createElement('li');
            li.innerHTML = `
              <div class="site-content">
                <span class="site-name">${domain}</span>
                <span class="site-time">${formatTime(time)}</span>
                <span class="site-percent">${percent}%</span>
                <button class="update-goal-btn" data-domain="${domain}" style="margin-left:1rem;background:var(--glass-bg);color:var(--primary);border:1px solid var(--border);border-radius:8px;padding:0.2rem 0.7rem;font-size:0.95rem;cursor:pointer;">Update Goal</button>
              </div>
              <div class="site-bar" style="width:${percent}%; background: var(--secondary-color);"></div>
            `;
            prodList.appendChild(li);
        });
        const totalUnprod = Object.values(unproductiveSites).reduce((a, b) => a + b, 0) || 1;
        (topUnproductiveSites || []).forEach(([domain, time]) => {
            const percent = ((time / totalUnprod) * 100).toFixed(1);
            const li = document.createElement('li');
            li.innerHTML = `
              <div class="site-content">
                <span class="site-name">${domain}</span>
                <span class="site-time">${formatTime(time)}</span>
                <span class="site-percent">${percent}%</span>
              </div>
              <div class="site-bar" style="width:${percent}%; background: var(--accent-color);"></div>
            `;
            unprodList.appendChild(li);
        });

        // Update goals progress bar with current productive time
        if (typeof updateGoalProgress === 'function') {
            updateGoalProgress(productiveTime, range);
        }
        // Notify website goals of latest productiveSites
        if (window.updateWebsiteGoalsProgress) {
            window.updateWebsiteGoalsProgress({ productiveSites }, range);
        }
    } catch (err) {
        console.error("Error fetching analytics: ", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAnalytics(currentRange);

    document.querySelectorAll('.chart-controls button').forEach(button => {
        button.addEventListener('click', e => {
            const chartId = e.target.dataset.chartId;
            const chartType = e.target.dataset.chartType;

            e.target.parentElement.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const key = chartId.replace('Chart', '');
            const data = chartData[key];
            if (data) {
                createChart(chartId, chartType, data.data, data.labels, data.colors);
            }
        });
    });

    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentRange = btn.dataset.range;

            document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            fetchAnalytics(currentRange);
            
            // Also refresh the website limits for the new range
            if (typeof renderWebsiteLimitCards === 'function') {
                renderWebsiteLimitCards(currentRange);
            }
        });
    });

    // On load, show progress bar loading state
    if (typeof updateGoalProgress === 'function') {
        updateGoalProgress(null, currentRange);
    }

    // Add event delegation for update-goal-btn
    document.getElementById('topProductiveSitesList').addEventListener('click', function(e) {
        if (e.target.classList.contains('update-goal-btn')) {
            const domain = e.target.getAttribute('data-domain');
            // Open the Set Website Goal modal pre-filled with the domain
            if (window.goalWebsiteInput && window.goalMinutesInput && window.goalTypeInput && window.websiteGoalModal) {
                window.goalWebsiteInput.value = domain;
                window.goalMinutesInput.value = '';
                window.goalTypeInput.value = 'daily';
                window.websiteGoalModal.style.display = 'flex';
            }
        }
    });
});

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    Object.keys(charts).forEach(chartId => {
        if (charts[chartId]) {
            const dataKey = chartId.replace('Chart', '');
            const data = chartData[dataKey];
            if (data) {
                createChart(chartId, charts[chartId].config.type, data.data, data.labels, data.colors);
            }
        }
    });
}
