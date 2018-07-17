const DEBOUNCE_TIME = 200;

/** Converts all eligible images in the page into GIFs. */
function gifify() {
  // Gather all unprocessed images that aren't yet GIFs.
  const images = document.querySelectorAll(':not([src$=".gif"])[srcset]');

  for (const img of images) {
    const srcset = img.srcset.trim();

    if (srcset) {
      // Extract the first part of each src.
      const srcs = srcset.split(',').map(
          (src) => src.trim().split(/\s+/)[0]);

      const gifs = srcs.filter((src) => src.endsWith('.gif'));
      // Continue the loop if there are no GIFs here.
      if (gifs.length === 0) {
        continue;
      }

      // Grab the GIF. If we had more than one, this just grabs the first one.
      const gif = gifs[0];

      // Modify the img to point to the new GIF. First we must remove srcset,
      // as that takes precedence.
      img.setAttribute('data-pintergif-srcset', img.srcset);
      img.removeAttribute('srcset');
      img.setAttribute('src', gif);
    }
  }
}

/** Debounces a fn with a given timeout. */
function debounce(fn, timeout) {
  let id = null;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), timeout);
  };
}

/**
 * Begins converting images to GIFs and starts the mutation observer to listen
 * for changes in the DOM.
 */
function start() {
  // Fetch the main container for observing. If we can't find it,
  // just use the doc body.
  let mainContainer = document.querySelector('[role=main]');
  if (!mainContainer) {
    mainContainer = document.body;
  }

  // Debounce the update routine to avoid slowdown.
  const debouncedGifify = debounce(gifify, DEBOUNCE_TIME);
  const observer = new MutationObserver((event) => {
    debouncedGifify();
  });

  // Begin observing. Check for both child node changes as well as
  // attribute changes, in case src/srcset gets updated.
  observer.observe(mainContainer, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'srcset']
  });
}

start();
