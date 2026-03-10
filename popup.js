const toggle = document.getElementById('enabled');

// Load the current state.
chrome.storage.sync.get(DEFAULTS, (data) => {
  toggle.checked = data.enabled;
});

// Save state when the toggle changes.
toggle.addEventListener('change', () => {
  chrome.storage.sync.set({enabled: toggle.checked});
});
