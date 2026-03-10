const DEBOUNCE_TIME = 200;
// Load GIFs slightly before they enter the viewport.
const INTERSECTION_MARGIN = '20%';

/** Swaps a single image element to its GIF source. */
function gififyImg(img) {
  const srcset = img.srcset.trim();
  if (!srcset) return;

  // Extract the first part of each src.
  const srcs = srcset.split(',').map(
      (src) => src.trim().split(/\s+/)[0]);

  const gifs = srcs.filter((src) => src.endsWith('.gif'));
  if (gifs.length === 0) return;

  // Grab the GIF. If we had more than one, this just grabs the first one.
  const gif = gifs[0];

  // Modify the img to point to the new GIF. First we must remove srcset,
  // as that takes precedence.
  img.setAttribute('data-pintergif-srcset', img.srcset);
  img.removeAttribute('srcset');
  img.setAttribute('src', gif);
}

/** Finds eligible images and queues them for GIF swap when visible. */
function gifify(visibilityObserver) {
  // Gather all unprocessed images that aren't yet GIFs.
  const images = document.querySelectorAll(':not([src$=".gif"])[srcset]');

  for (const img of images) {
    visibilityObserver.observe(img);
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

  // Create an IntersectionObserver that swaps images to GIFs when they
  // enter (or are near) the viewport.
  const visibilityObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        gififyImg(entry.target);
        observer.unobserve(entry.target);
      }
    }
  }, {rootMargin: INTERSECTION_MARGIN});

  // Debounce the update routine to avoid slowdown.
  const debouncedGifify = debounce(
      () => gifify(visibilityObserver), DEBOUNCE_TIME);
  const mutationObserver = new MutationObserver((event) => {
    debouncedGifify();
  });

  // Begin observing. Check for both child node changes as well as
  // attribute changes, in case src/srcset gets updated.
  mutationObserver.observe(mainContainer, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'srcset']
  });
}

start();
