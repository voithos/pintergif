const toggles = Object.fromEntries(
    Object.keys(DEFAULTS).map((key) => [key, document.getElementById(key)]));

// Load the current state.
chrome.storage.sync.get(DEFAULTS, (data) => {
  for (const [key, el] of Object.entries(toggles)) {
    el.checked = data[key];
  }
});

// Save state when any toggle changes.
for (const [key, el] of Object.entries(toggles)) {
  el.addEventListener('change', () => {
    chrome.storage.sync.set({[key]: el.checked});
  });
}
