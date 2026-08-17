// work.js — transitions, preview updates, nav highlighting

// --- Transition / nav code ---
const blackBoxRight = document.getElementById("blackBoxRight");
const whiteBoxRight = document.getElementById("whiteBoxRight");

window.addEventListener("load", () => {
  // intro animation
  setTimeout(() => blackBoxRight.classList.add("shrink"), 100);
  setTimeout(() => whiteBoxRight.classList.add("expand"), 1200);
  setTimeout(() => {
    blackBoxRight.classList.add("up");
    whiteBoxRight.classList.add("up");
  }, 1400);

  // reveal arrow AFTER intro finishes
  setTimeout(() => {
    const arrow = document.querySelector('.nav-arrow');
    if (arrow) arrow.classList.add('visible');
  }, 2000);

  // nav transition
  const blackBoxFill = document.getElementById("blackBoxFill");
  const boxBtns = document.querySelectorAll(".BoxBtn");
  boxBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      blackBoxFill.style.display = "block";
      requestAnimationFrame(() => blackBoxFill.classList.add("expand"));
      setTimeout(() => { window.location.href = btn.href; }, 1100);
    });
  });

  ensureBlockHeights();
  computeCounterAnchor();
  initPreview();
  updateCounters();
  updateOnScroll();
});

// --- Measure the counter's anchor line directly from the DOM (mobile) ---
// Frame 1 has extra margin before it that a flat CSS percentage doesn't
// account for, so we measure its real position once instead of guessing.
// rect.top + scrollY is scroll-invariant — it always yields frame 1's
// distance from the top of the viewport as if the page were scrolled to
// the very top, no matter when this runs. That's exactly the "top" value
// a fixed-position counter needs to visually align with it, and it stays
// correct even if this recomputes mid-scroll (e.g. on resize).
// updateCounters() uses this same number as BOTH the counter's visual
// "top" AND the trigger line for deciding which project is active — they
// have to be the same value, or the handoff won't line up with what's
// actually on screen.
let counterAnchorPx = null;
function computeCounterAnchor() {
  if (window.innerWidth > 760) { counterAnchorPx = null; return; }
  const firstFrame = document.querySelector('.project-block[data-project="01"] .frame');
  if (!firstFrame) { counterAnchorPx = null; return; }
  const scrollY = window.scrollY || window.pageYOffset || 0;
  counterAnchorPx = firstFrame.getBoundingClientRect().top + scrollY;
}

// --- Ensure each project-block spans its frames ---
function ensureBlockHeights() {
  document.querySelectorAll('.project-block').forEach(block => {
    const previews = block.querySelector('.project-previews');
    if (!previews) return;
    const offsetTop = previews.offsetTop;
    const totalFramesHeight = previews.scrollHeight;
    const required = offsetTop + totalFramesHeight + 140;
    block.style.minHeight = required + 'px';
  });
}

// --- Big preview init ---
let activeBig = 'a';
function initPreview() {
  const vA = document.querySelector('.big-video.a');
  const vB = document.querySelector('.big-video.b');
  [vA, vB].forEach(v => {
    v.muted = true;
    v.playsInline = true;
    v.pause();
    v.removeAttribute('src');
    try { v.load(); } catch(e){}
    v.classList.remove('visible');
  });
  activeBig = 'a';
}

// --- Instant swap to preview video ---
function swapTo(src) {
  if (!src) return;
  const vA = document.querySelector('.big-video.a');
  const vB = document.querySelector('.big-video.b');
  const current = (activeBig === 'a') ? vA : vB;
  const next = (activeBig === 'a') ? vB : vA;

  next.pause();
  next.removeAttribute('src');
  next.src = src;
  next.load();

  next.oncanplay = () => {
    next.play().catch(()=>{});
    next.classList.add('visible');
    current.classList.remove('visible');
    activeBig = (activeBig === 'a') ? 'b' : 'a';
  };
}

// --- Clear preview instantly ---
function clearPreview() {
  const vA = document.querySelector('.big-video.a');
  const vB = document.querySelector('.big-video.b');
  [vA, vB].forEach(v => {
    v.pause();
    v.removeAttribute('src');
    try { v.load(); } catch(e){}
    v.classList.remove('visible');
  });
  const previewDescEl = document.querySelector('.project-description p');
  if (previewDescEl) previewDescEl.textContent = '';
}

// --- Counter slide logic ---
function updateCounters() {
  const isMobile = window.innerWidth <= 760;
  // Mobile uses the measured anchor (frame 1's real position) so the
  // counter actually lines up with it. Desktop keeps the simple 43%
  // (no extra margin to account for there, so a fraction is fine).
  const counterViewportY = (isMobile && counterAnchorPx != null)
    ? counterAnchorPx
    : window.innerHeight * 0.43;
  const counterTopCss = (isMobile && counterAnchorPx != null)
    ? counterAnchorPx + 'px'
    : '43%';

  const blockData = Array.from(document.querySelectorAll('.project-block'))
    .map(block => {
      const frames = block.querySelectorAll('.frame');
      return {
        block,
        counter: block.querySelector('.project-counter'),
        firstFrame: frames[0],
        lastFrame: frames[frames.length - 1]
      };
    })
    .filter(d => d.firstFrame && d.lastFrame && d.counter);

  blockData.forEach((data, i) => {
    const { counter, lastFrame } = data;
    counter.classList.remove('active', 'slideup');

    // Boundary AFTER this project: the midpoint between this project's
    // last frame and the next project's first frame — both read live via
    // getBoundingClientRect, which is already viewport-relative and
    // updates correctly on every scroll with no manual tracking needed.
    // Using the actual midpoint (instead of a guessed pixel offset) means
    // there's no dead zone in between where neither counter is "active" —
    // whatever the gap/margin between projects, the handoff always lines
    // up, and it can never get stuck.
    let afterBoundary = Infinity;
    if (i < blockData.length - 1) {
      const thisLastRect = lastFrame.getBoundingClientRect();
      const nextFirstRect = blockData[i + 1].firstFrame.getBoundingClientRect();
      afterBoundary = (thisLastRect.bottom + nextFirstRect.top) / 2;
    }

    // Boundary BEFORE this project is just the previous project's
    // afterBoundary — they share the same handoff line.
    let beforeBoundary = -Infinity;
    if (i > 0) {
      const prevLastRect = blockData[i - 1].lastFrame.getBoundingClientRect();
      const thisFirstRect = data.firstFrame.getBoundingClientRect();
      beforeBoundary = (prevLastRect.bottom + thisFirstRect.top) / 2;
    }

    if (counterViewportY >= beforeBoundary && counterViewportY < afterBoundary) {
      counter.classList.add('active');
      counter.style.position = 'fixed';
      counter.style.top = counterTopCss;
    } else if (counterViewportY >= afterBoundary) {
      // scrolled past this project — park its counter at the bottom of
      // its own block instead of leaving it pinned in place
      counter.classList.add('slideup');
      counter.style.position = 'absolute';
      counter.style.top = (lastFrame.offsetTop + lastFrame.offsetHeight - counter.offsetHeight) + 'px';
    }
    // else: haven't scrolled to this project yet — leave it with no
    // class, matching its default (hidden) state
  });
}

// --- Move nav arrow smoothly and align with text ---
function moveNavArrow() {
  const arrow = document.querySelector('.nav-arrow');
  const activeItem = document.querySelector('.project-nav li.active');
  if (arrow && activeItem) {
    const itemRect = activeItem.getBoundingClientRect();
    const navRect = activeItem.parentElement.getBoundingClientRect();
    const offsetTop = itemRect.top - navRect.top + (itemRect.height / 1) - (arrow.offsetHeight / 2);
    arrow.style.top = offsetTop + 'px';
  }
}

// --- Preview + nav highlighting ---
function updateOnScroll() {
  const previewDescEl = document.querySelector('.project-description p');
  const navItems = document.querySelectorAll('.center-nav .project-nav li');

  let foundActive = false;

  document.querySelectorAll('.project-block').forEach(block => {
    const frames = block.querySelectorAll('.frame');
    const rect = block.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    if (rect.top < viewportHeight && rect.bottom > 0) {
      // find the frame that’s aligned in view
      let activeFrame = null;
      for (let frame of frames) {
        const r = frame.getBoundingClientRect();
        // adjust threshold so frame 1 triggers correctly
        if (r.top <= viewportHeight * 0.5 && r.bottom >= viewportHeight * 0.5) {
          activeFrame = frame;
          break;
        }
      }

      if (activeFrame) {
        const previewSrc = activeFrame.dataset.preview;
        const previewDesc = activeFrame.dataset.description || '';
        swapTo(previewSrc); // instantly load that frame’s preview video
        previewDescEl.textContent = previewDesc;
        foundActive = true;
      }
    }
  });

  if (!foundActive) {
    clearPreview(); // nothing aligned → clear big preview
  }

  // highlight nav based on counters
  const counters = document.querySelectorAll('.project-counter');
  counters.forEach((counter, i) => {
    if (counter.classList.contains('active')) {
      navItems.forEach((n, idx) => n.classList.toggle('active', idx === i));
      moveNavArrow();
    }
  });
}

// Scroll listener
let ticking = false;
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => {
      updateCounters();
      updateOnScroll();
      ticking = false;
    });
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => {
  clearTimeout(window._resizeTimer);
  window._resizeTimer = setTimeout(() => {
    ensureBlockHeights();
    computeCounterAnchor();
    updateCounters();
    updateOnScroll();
  }, 120);
});

// initial run
ensureBlockHeights();
computeCounterAnchor();
initPreview();
updateCounters();
updateOnScroll();

