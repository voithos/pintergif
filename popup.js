const toggle = document.getElementById('enabled');
const animToggle = document.getElementById('showLoadingIndicator');

// Load the current state.
chrome.storage.sync.get(DEFAULTS, (data) => {
  toggle.checked = data.enabled;
  animToggle.checked = data.showLoadingIndicator;
});

// Save state when the toggles change.
toggle.addEventListener('change', () => {
  chrome.storage.sync.set({enabled: toggle.checked});
});
animToggle.addEventListener('change', () => {
  chrome.storage.sync.set({showLoadingIndicator: animToggle.checked});
});
