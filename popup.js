const toggle = document.getElementById('enabled');
const gifsToggle = document.getElementById('autoplayGifs');
const videosToggle = document.getElementById('autoplayVideos');
const animToggle = document.getElementById('showLoadingIndicator');

// Load the current state.
chrome.storage.sync.get(DEFAULTS, (data) => {
  toggle.checked = data.enabled;
  gifsToggle.checked = data.autoplayGifs;
  videosToggle.checked = data.autoplayVideos;
  animToggle.checked = data.showLoadingIndicator;
});

// Save state when the toggles change.
toggle.addEventListener('change', () => {
  chrome.storage.sync.set({enabled: toggle.checked});
});
gifsToggle.addEventListener('change', () => {
  chrome.storage.sync.set({autoplayGifs: gifsToggle.checked});
});
videosToggle.addEventListener('change', () => {
  chrome.storage.sync.set({autoplayVideos: videosToggle.checked});
});
animToggle.addEventListener('change', () => {
  chrome.storage.sync.set({showLoadingIndicator: animToggle.checked});
});
