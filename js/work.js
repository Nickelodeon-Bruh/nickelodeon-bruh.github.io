const blackBoxRight = document.getElementById("blackBoxRight");
const whiteBoxRight = document.getElementById("whiteBoxRight");

window.addEventListener("load", () => {
  setTimeout(() => blackBoxRight.classList.add("shrink"), 100);
  setTimeout(() => whiteBoxRight.classList.add("expand"), 1200);
  setTimeout(() => {
    blackBoxRight.classList.add("up");
    whiteBoxRight.classList.add("up");
  }, 1400);

  setTimeout(() => {
    const arrow = document.querySelector('.nav-arrow');
    if (arrow) arrow.classList.add('visible');
  }, 2000);

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
  initLazyVideos();
  updateCounters();
  updateOnScroll();
});

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

function initLazyVideos() {
  const videos = document.querySelectorAll('.project-previews video[data-src]');
  if (!videos.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const v = entry.target;
      if (entry.isIntersecting) {
        if (!v.getAttribute('src') && v.dataset.src) {
          v.src = v.dataset.src;
          v.load();
        }
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { rootMargin: '200px 0px', threshold: 0.01 });

  videos.forEach(v => io.observe(v));
}

let activeBig = 'a';
function initPreview() {
  const vA = document.querySelector('.big-video.a');
  const vB = document.querySelector('.big-video.b');
  if (!vA || !vB) return;
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

let descFadeTimer = null;
function setDescription(text) {
  const wrap = document.querySelector('.project-description');
  const p = wrap ? wrap.querySelector('p') : null;
  if (!wrap || !p) return;
  if (p.textContent === text) return;

  clearTimeout(descFadeTimer);
  wrap.classList.add('fading');
  descFadeTimer = setTimeout(() => {
    p.textContent = text;
    wrap.classList.remove('fading');
  }, 220);
}

function swapTo(src) {
  if (!src) return;
  const vA = document.querySelector('.big-video.a');
  const vB = document.querySelector('.big-video.b');
  if (!vA || !vB) return;
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

function clearPreview() {
  const vA = document.querySelector('.big-video.a');
  const vB = document.querySelector('.big-video.b');
  if (vA && vB) {
    [vA, vB].forEach(v => {
      v.pause();
      v.removeAttribute('src');
      try { v.load(); } catch(e){}
      v.classList.remove('visible');
    });
  }
  setDescription('');
  currentPreviewSrc = null;
}

function getDocumentTop(el) {
  let top = 0;
  while (el) {
    top += el.offsetTop || 0;
    el = el.offsetParent;
  }
  return top;
}

function updateCounters() {
  const blocks = document.querySelectorAll('.project-block');

  let counterViewportY;
  let anchorCss;
  const firstFrameEver = document.querySelector('.project-block[data-project="01"] .frame');
  if (firstFrameEver) {
    counterViewportY = getDocumentTop(firstFrameEver);
    anchorCss = counterViewportY + 'px';
  } else {
    counterViewportY = window.innerHeight * 0.43;
    anchorCss = '43%';
  }

  const isMobile = window.innerWidth <= 760;
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
        counter.style.top = anchorCss;
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
        counter.style.top = anchorCss;
      } else if (rectLast.bottom <= counterViewportY) {
        counter.classList.add('slideup');
        counter.style.position = 'absolute';
        counter.style.top = (lastFrame.offsetTop + lastFrame.offsetHeight - counter.offsetHeight) + 'px';
      }
    }
  });
}

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

let currentPreviewSrc = null;

function updateOnScroll() {
  const navItems = document.querySelectorAll('.center-nav .project-nav li');

  let foundActive = false;

  document.querySelectorAll('.project-block').forEach(block => {
    const frames = block.querySelectorAll('.frame');
    const rect = block.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    if (rect.top < viewportHeight && rect.bottom > 0) {
      let activeFrame = null;
      for (let frame of frames) {
        const r = frame.getBoundingClientRect();
        if (r.top <= viewportHeight * 0.5 && r.bottom >= viewportHeight * 0.5) {
          activeFrame = frame;
          break;
        }
      }

      if (activeFrame) {
        const previewSrc = activeFrame.dataset.preview;
        const previewDesc = activeFrame.dataset.description || '';
        if (previewSrc !== currentPreviewSrc) {
          swapTo(previewSrc);
          currentPreviewSrc = previewSrc;
        }
        setDescription(previewDesc);
        foundActive = true;
      }
    }
  });

  if (!foundActive) {
    clearPreview();
  }

  const counters = document.querySelectorAll('.project-counter');
  counters.forEach((counter, i) => {
    if (counter.classList.contains('active')) {
      navItems.forEach((n, idx) => n.classList.toggle('active', idx === i));
      moveNavArrow();
    }
  });
}

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

window.addEventListener('scroll', onScroll, { passive: true, capture: true });
window.addEventListener('resize', () => {
  clearTimeout(window._resizeTimer);
  window._resizeTimer = setTimeout(() => {
    ensureBlockHeights();
    updateCounters();
    updateOnScroll();
  }, 120);
});

ensureBlockHeights();
initPreview();
initLazyVideos();
updateCounters();
updateOnScroll();