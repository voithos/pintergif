const DEBOUNCE_TIME = 200;
// Load GIFs slightly before they enter the viewport.
const INTERSECTION_MARGIN = '20%';

const PIN_BORDER_RADIUS = 16;

/** Injects the loading animation styles into the page. */
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pintergif-trace {
      to { offset-distance: 100%; }
    }
    /* Static dim blue border glow. */
    .pintergif-loading-wrapper::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      box-shadow: inset 0 0 6px 4px rgba(91, 155, 245, 0.5) !important;
      border-radius: ${PIN_BORDER_RADIUS}px !important;
      pointer-events: none !important;
      z-index: 10 !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Builds an SVG path string for a rounded rectangle offset from (x, y).
 * Used as the offset-path for the runner elements.
 */
function buildRoundedRectPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + r} ${y}`,                          // start of top edge
    `H ${x + w - r}`,                           // top edge →
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,      // top-right corner ↘
    `V ${y + h - r}`,                           // right edge ↓
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,  // bottom-right corner ↙
    `H ${x + r}`,                               // bottom edge ←
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,      // bottom-left corner ↖
    `V ${y + r}`,                               // left edge ↑
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,          // top-left corner ↗
    'Z',
  ].join(' ');
}

/**
 * Manages the loading animation for a single image: a static blue glow
 * and an animated snake runner tracing the border.
 */
class LoadingAnimation {
  /**
   * @param {HTMLElement} wrapper – the nearest positioned ancestor of the
   *     image, used as the glow/runner container.
   */
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.segments = [];
    this.savedOverflow = wrapper.style.overflow;

    this.wrapper.classList.add('pintergif-loading-wrapper');
    this._createRunner();
  }

  /** Builds and appends the snake runner segments to the wrapper. */
  _createRunner() {
    const container = document.createDocumentFragment();
    const width = this.wrapper.clientWidth;
    const height = this.wrapper.clientHeight;
    // Inset the path slightly so the runner isn't clipped too much by overflow:hidden.
    // But we still want it to hug the border.
    const inset = 1;
    const r = Math.max(PIN_BORDER_RADIUS - inset, 0);
    const path = buildRoundedRectPath(
        inset, inset, width - inset * 2, height - inset * 2, r);

    // Create multiple small segments spaced along the path to form a
    // snake-like trail that bends around corners.
    const segmentCount = 12;
    // Spacing between segments as a percentage of the total path.
    const spacing = 1.2;

    for (let i = 0; i < segmentCount; i++) {
      const segment = document.createElement('div');
      // Fade opacity from transparent (tail) to bright (head).
      const opacity = (i + 1) / segmentCount;
      const delay = -(i * spacing / 100) * 2;

      // Styles must be set inline rather than via a stylesheet class.
      // Pinterest's own CSS rules override class-based offset-path
      // properties, breaking the animation.
      Object.assign(segment.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '4px',
        height: '2px',
        borderRadius: '1px',
        background: `rgba(221, 234, 255, ${opacity})`,
        boxShadow: `0 0 ${6 * opacity}px ${2 * opacity}px rgba(100, 170, 255, ${opacity * 0.9}), `
          + `0 0 ${14 * opacity}px ${4 * opacity}px rgba(60, 130, 245, ${opacity * 0.6})`,
        pointerEvents: 'none',
        zIndex: '11',
        offsetPath: `path("${path}")`,
        offsetDistance: '0%',
        offsetRotate: 'auto',
        offsetAnchor: 'center',
        animation: `pintergif-trace 2.5s linear infinite ${delay}s`,
      });

      container.appendChild(segment);
      this.segments.push(segment);
    }

    // Ensure the wrapper doesn't clip the runner's glow.
    this.wrapper.style.overflow = 'visible';
    this.wrapper.appendChild(container);
  }

  /** Removes the glow class and all runner segments from the DOM. */
  remove() {
    this.wrapper.classList.remove('pintergif-loading-wrapper');
    this.wrapper.style.overflow = this.savedOverflow;
    for (const seg of this.segments) {
      seg.remove();
    }
    this.segments = [];
  }
}

/**
 * Finds the nearest positioned ancestor of the image to use as the
 * loading wrapper. Falls back to the direct parent.
 */
function findWrapper(img) {
  let el = img.parentElement;
  while (el && el !== document.body) {
    const position = getComputedStyle(el).position;
    if (position === 'relative' || position === 'absolute') {
      return el;
    }
    el = el.parentElement;
  }
  return img.parentElement;
}

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

  // Show loading animation on the closest positioned ancestor.
  const wrapper = findWrapper(img);
  const loading = new LoadingAnimation(wrapper);
  img.addEventListener('load', () => loading.remove(), {once: true});

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
  injectStyles();

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

  let mutationObserver = null;

  /** Starts observing and converting GIFs. */
  function enable() {
    if (mutationObserver) return;

    mutationObserver = new MutationObserver(() => {
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

    // Run once immediately for any images already on the page.
    debouncedGifify();
  }

  /** Stops observing. Already-converted GIFs remain as-is. */
  function disable() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    visibilityObserver.disconnect();
  }

  // Check the initial enabled state.
  chrome.storage.sync.get(DEFAULTS, (data) => {
    if (data.enabled) {
      enable();
    }
  });

  // Listen for changes from the popup toggle.
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      if (changes.enabled.newValue) {
        enable();
      } else {
        disable();
      }
    }
  });
}

start();
