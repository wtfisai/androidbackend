// API Configuration
let API_KEY = localStorage.getItem('apiKey') || '';
const API_BASE = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  if (!API_KEY) {
    // Try to get API key from the server
    try {
      const response = await fetch('/api/info');
      const info = await response.json();
      if (info.apiKey) {
        localStorage.setItem('apiKey', info.apiKey);
        API_KEY = info.apiKey;
        showAlert('API key configured automatically!', 'success');
      }
    } catch (e) {
      const key = prompt('Enter your API key (default: diagnostic-api-key-2024):');
      if (key) {
        localStorage.setItem('apiKey', key);
        API_KEY = key;
        location.reload();
      }
    }
  }

  // Load initial data
  loadSystemInfo();
  loadBatteryInfo();
  loadNetworkInfo();

  // Set up auto-refresh
  setInterval(() => {
    updateStats();
  }, 30000); // Update every 30 seconds

  // Set up search filters
  document.getElementById('processSearch')?.addEventListener('input', filterProcesses);
  document.getElementById('packageSearch')?.addEventListener('input', filterPackages);
});

// Show alert message
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
  document.getElementById('alertContainer').appendChild(alertDiv);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Update connection status
function updateConnectionStatus(connected) {
  const status = document.getElementById('connectionStatus');
  if (connected) {
    status.className = 'badge bg-success';
    status.innerHTML = '<i class="bi bi-wifi"></i> Connected';
  } else {
    status.className = 'badge bg-danger';
    status.innerHTML = '<i class="bi bi-wifi-off"></i> Disconnected';
  }
}

// Fetch API with error handling
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    updateConnectionStatus(true);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    updateConnectionStatus(false);
    showAlert(`Error: ${error.message}`, 'danger');
    return null;
  }
}

// Update stats cards
async function updateStats() {
  const system = await fetchAPI('/api/system');
  if (system) {
    document.getElementById('cpuCount').textContent = system.cpus || '-';
    const memUsed = ((1 - system.freeMemory / system.totalMemory) * 100).toFixed(1);
    document.getElementById('memoryUsage').textContent = `${memUsed}%`;
    const hours = Math.floor(system.uptime / 3600);
    const minutes = Math.floor((system.uptime % 3600) / 60);
    document.getElementById('uptime').textContent = `${hours}h ${minutes}m`;
  }

  const battery = await fetchAPI('/api/device/battery');
  if (battery) {
    const level = battery.level || '?';
    const icon = battery.status === 'Charging' ? 'bi-battery-charging' : 'bi-battery-half';
    document.getElementById('batteryLevel').innerHTML = `<i class="bi ${icon}"></i> ${level}%`;
  }
}

// Load system information
async function loadSystemInfo() {
  const info = await fetchAPI('/api/system');
  const container = document.getElementById('systemInfo');

  if (info) {
    container.innerHTML = `
            <table class="table table-sm">
                <tr><td><strong>Hostname:</strong></td><td>${info.hostname}</td></tr>
                <tr><td><strong>Platform:</strong></td><td>${info.platform}</td></tr>
                <tr><td><strong>Architecture:</strong></td><td>${info.arch}</td></tr>
                <tr><td><strong>Release:</strong></td><td>${info.release}</td></tr>
                <tr><td><strong>CPUs:</strong></td><td>${info.cpus}</td></tr>
                <tr><td><strong>Total Memory:</strong></td><td>${formatBytes(info.totalMemory)}</td></tr>
                <tr><td><strong>Free Memory:</strong></td><td>${formatBytes(info.freeMemory)}</td></tr>
                <tr><td><strong>Load Average:</strong></td><td>${info.loadAverage?.map((l) => l.toFixed(2)).join(', ')}</td></tr>
            </table>
        `;
  } else {
    container.innerHTML = '<p class="text-danger">Failed to load system information</p>';
  }
}

// Load network information
async function loadNetworkInfo() {
  const info = await fetchAPI('/api/device/network');
  const container = document.getElementById('networkInfo');

  if (info && info.interfaces) {
    let html = '<div class="list-group">';
    info.interfaces.forEach((iface) => {
      if (iface.addresses.length > 0) {
        html += `
                    <div class="list-group-item">
                        <strong>${iface.name}</strong>
                        ${iface.addresses
                          .map((addr) => `<div><small class="text-muted">${addr}</small></div>`)
                          .join('')}
                    </div>
                `;
      }
    });
    html += '</div>';
    container.innerHTML = html;
  } else {
    container.innerHTML = '<p class="text-danger">Failed to load network information</p>';
  }
}

// Load device properties
async function loadDeviceProperties() {
  const props = await fetchAPI('/api/device/properties');
  const container = document.getElementById('deviceProps');

  if (props) {
    container.innerHTML = `
            <table class="table table-sm">
                <tr><td><strong>Android Version:</strong></td><td>${props.androidVersion || 'N/A'}</td></tr>
                <tr><td><strong>SDK Version:</strong></td><td>${props.sdkVersion || 'N/A'}</td></tr>
                <tr><td><strong>Device:</strong></td><td>${props.device || 'N/A'}</td></tr>
                <tr><td><strong>Model:</strong></td><td>${props.model || 'N/A'}</td></tr>
                <tr><td><strong>Manufacturer:</strong></td><td>${props.manufacturer || 'N/A'}</td></tr>
                <tr><td><strong>Build ID:</strong></td><td>${props.buildId || 'N/A'}</td></tr>
                <tr><td><strong>Build Date:</strong></td><td>${props.buildDate || 'N/A'}</td></tr>
            </table>
        `;
  } else {
    container.innerHTML = '<p class="text-danger">Failed to load device properties</p>';
  }
}

// Load battery information
async function loadBatteryInfo() {
  const battery = await fetchAPI('/api/device/battery');
  const container = document.getElementById('batteryInfo');

  if (battery) {
    const html = Object.entries(battery)
      .filter(([key, value]) => value && value !== '')
      .map(([key, value]) => `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`)
      .join('');
    container.innerHTML = `<table class="table table-sm">${html}</table>`;
  } else {
    container.innerHTML = '<p class="text-danger">Failed to load battery information</p>';
  }
}

// Load processes
async function loadProcesses() {
  const data = await fetchAPI('/api/processes');
  const tbody = document.getElementById('processList');

  if (data && data.processes) {
    document.getElementById('processCount').textContent = data.count;

    const html = data.processes
      .slice(0, 100)
      .map(
        (proc) => `
            <tr>
                <td>${proc.pid}</td>
                <td>${proc.user}</td>
                <td><small>${proc.name || proc.command || '-'}</small></td>
                <td>${proc.cpu || '-'}</td>
                <td>${proc.mem || '-'}</td>
            </tr>
        `
      )
      .join('');
    tbody.innerHTML = html;
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="text-danger">Failed to load processes</td></tr>';
  }
}

// Filter processes
function filterProcesses() {
  const search = document.getElementById('processSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#processList tr');

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}

// Load packages
async function loadPackages() {
  const data = await fetchAPI('/api/packages');
  const container = document.getElementById('packageList');

  if (data && data.packages) {
    document.getElementById('packageCount').textContent = data.count;

    const html = data.packages
      .map((pkg) => `<div class="badge bg-secondary m-1">${pkg}</div>`)
      .join('');
    container.innerHTML = html;
  } else {
    container.innerHTML = '<p class="text-danger">Failed to load packages</p>';
  }
}

// Filter packages
function filterPackages() {
  const search = document.getElementById('packageSearch').value.toLowerCase();
  const badges = document.querySelectorAll('#packageList .badge');

  badges.forEach((badge) => {
    const text = badge.textContent.toLowerCase();
    badge.style.display = text.includes(search) ? '' : 'none';
  });
}

// Load storage information
async function loadStorageInfo() {
  const data = await fetchAPI('/api/storage');
  const container = document.getElementById('storageInfo');

  if (data && data.storage) {
    const html = data.storage
      .map(
        (fs) => `
            <div class="card mb-2">
                <div class="card-body">
                    <h6>${fs.filesystem}</h6>
                    <div class="progress mb-2">
                        <div class="progress-bar" style="width: ${fs.usePercent}">
                            ${fs.usePercent}
                        </div>
                    </div>
                    <small class="text-muted">
                        ${fs.used} / ${fs.size} (${fs.available} free)
                        <br>Mounted at: ${fs.mounted}
                    </small>
                </div>
            </div>
        `
      )
      .join('');
    container.innerHTML = html;
  } else {
    container.innerHTML = '<p class="text-danger">Failed to load storage information</p>';
  }
}

// Execute command
async function executeCommand() {
  const input = document.getElementById('commandInput');
  const output = document.getElementById('terminalOutput');
  const command = input.value.trim();

  if (!command) {
    return;
  }

  const isAdb = document.getElementById('cmdAdb').checked;
  output.innerHTML += `\n$ ${command}\n`;

  const endpoint = isAdb ? '/api/adb/execute' : '/api/shell';
  const result = await fetchAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify({ command })
  });

  if (result) {
    output.innerHTML += result.output || '';
    if (result.stderr) {
      output.innerHTML += `\n<span class="text-danger">${result.stderr}</span>`;
    }
  } else {
    output.innerHTML += '<span class="text-danger">Command failed</span>';
  }

  output.innerHTML += '\n$ ';
  output.scrollTop = output.scrollHeight;
  input.value = '';
}

// Handle Enter key in command input
function handleCommandKey(event) {
  if (event.key === 'Enter') {
    executeCommand();
  }
}

// Load logs
async function loadLogs() {
  const lines = document.getElementById('logLines').value || 100;
  const filter = document.getElementById('logFilter').value || '';
  const output = document.getElementById('logOutput');

  output.innerHTML = 'Loading logs...';

  const endpoint = `/api/logcat?lines=${lines}&filter=${encodeURIComponent(filter)}`;
  const result = await fetchAPI(endpoint);

  if (result && result.logs) {
    output.innerHTML = result.logs.join('\n');
    output.scrollTop = output.scrollHeight;
  } else {
    output.innerHTML = '<span class="text-danger">Failed to load logs</span>';
  }
}

// Utility function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initial stats update
updateStats();
