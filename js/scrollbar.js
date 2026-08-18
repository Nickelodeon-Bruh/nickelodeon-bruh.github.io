(function () {
  function init() {
    var doc = document.documentElement;

    var thumb = document.createElement('div');
    thumb.id = 'customScrollbarThumb';
    document.body.appendChild(thumb);

    var glow = document.createElement('div');
    glow.id = 'customScrollbarGlow';
    glow.classList.add('bg-light');
    document.body.appendChild(glow);

    var bgSections = [];
    document.querySelectorAll('[data-scrollbar-bg]').forEach(function (el) {
      var mode = el.getAttribute('data-scrollbar-bg');
      if (mode === 'light' || mode === 'dark') {
        bgSections.push({ el: el, mode: mode });
      }
    });

    function getBgMode() {
      if (!bgSections.length) return 'light';
      var centerY = window.innerHeight / 2;
      for (var i = 0; i < bgSections.length; i++) {
        var rect = bgSections[i].el.getBoundingClientRect();
        if (rect.top <= centerY && rect.bottom >= centerY) {
          return bgSections[i].mode;
        }
      }
      return 'light';
    }

    function updateGlowMode() {
      var mode = getBgMode();
      var isDark = mode === 'dark';
      glow.classList.toggle('bg-dark', isDark);
      glow.classList.toggle('bg-light', !isDark);
    }

    var scrollableHeight = 0;
    var target = 0;   // real scroll percentage, 0-100
    var current = 0;  // displayed (eased) percentage, chases target

    function recalc() {
      scrollableHeight = doc.scrollHeight - window.innerHeight;
      var visible = scrollableHeight > 4;
      thumb.style.display = visible ? 'block' : 'none';
      glow.style.display = visible ? 'block' : 'none';
    }

    function measureTarget() {
      var pct = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
      target = Math.min(100, Math.max(0, pct));
    }

    function frame() {
      if (scrollableHeight > 4) {
        var diff = target - current;
        if (Math.abs(diff) < 0.05) {
          current = target;
        } else {
          current += diff * 0.15;
        }
      
        if (window.innerWidth <= 760) {
          thumb.style.width = current + '%';
          thumb.style.height = '';
          glow.style.width = current + '%';
          glow.style.height = '';
        } else {
          thumb.style.height = current + '%';
          thumb.style.width = '';
          glow.style.height = current + '%';
          glow.style.width = '';
        }
      }
      requestAnimationFrame(frame);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        recalc();
        measureTarget();
        updateGlowMode();
      }, 120);
    });

    // Layout can shift after images/videos finish loading (this page has
    // several), which changes doc.scrollHeight — recheck once that settles.
    window.addEventListener('load', function () {
      recalc();
      measureTarget();
      updateGlowMode();
    });

    window.addEventListener('scroll', function () {
      measureTarget();
      updateGlowMode();
    }, { passive: true });

    recalc();
    measureTarget();
    updateGlowMode();
    current = target; // start at the right fill immediately, no ease-in from 0
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();