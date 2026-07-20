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
  initPreview();
  updateOnScroll();
  updateCounters();
});

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
  const blocks = document.querySelectorAll('.project-block');
  const counterViewportY = window.innerHeight * 0.43;
  const appearOffset = 150;
  const disappearOffset = 150;

  blocks.forEach(block => {
    const counter = block.querySelector('.project-counter');
    const frames = block.querySelectorAll('.frame');
    if (!frames.length) return;
    const firstFrame = frames[0];
    const lastFrame = frames[frames.length - 1];
    const rectFirst = firstFrame.getBoundingClientRect();
    const rectLast = lastFrame.getBoundingClientRect();

    counter.classList.remove('active','slideup');

    if (block.dataset.project === '01') {
      if (rectLast.bottom > counterViewportY + disappearOffset) {
        counter.classList.add('active');
        counter.style.position = 'fixed';
        counter.style.top = '43%';
      } else {
        counter.classList.add('slideup');
        counter.style.position = 'absolute';
        counter.style.top = (lastFrame.offsetTop + lastFrame.offsetHeight - counter.offsetHeight) + 'px';
      }
    }

    if (block.dataset.project === '02') {
      if (rectFirst.top <= counterViewportY + appearOffset && rectLast.bottom > counterViewportY) {
        counter.classList.add('active');
        counter.style.position = 'fixed';
        counter.style.top = '43%';
      } else if (rectLast.bottom <= counterViewportY) {
        counter.classList.add('slideup');
        counter.style.position = 'absolute';
        counter.style.top = (lastFrame.offsetTop + lastFrame.offsetHeight - counter.offsetHeight) + 'px';
      }
    }
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
      updateOnScroll();
      updateCounters();
      ticking = false;
    });
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => {
  clearTimeout(window._resizeTimer);
  window._resizeTimer = setTimeout(() => {
    ensureBlockHeights();
    updateOnScroll();
    updateCounters();
  }, 120);
});

// initial run
ensureBlockHeights();
initPreview();
updateOnScroll();
updateCounters();
