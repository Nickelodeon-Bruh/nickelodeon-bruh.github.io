// Intro animation sequence
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
    const containers = [
      document.querySelectorAll('#bioContainer .reveal'),
      document.querySelectorAll('#backgroundContainer .reveal'),
      document.querySelectorAll('#educationContainer .reveal')
    ];
    containers.forEach(lines => {
      lines.forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), i * 100);
      });
    });
  }, 1600);

  // Slideshow logic with staggered start
  document.querySelectorAll('.slideshow').forEach((slideshow, index) => {
    const slides = slideshow.querySelectorAll('.slides img');
    let current = 0;

    function showSlide(i) {
      slides.forEach((img, j) => img.classList.toggle('active', j === i));
    }
    showSlide(current);

    let intervalTime = 4000;
    if (slideshow.classList.contains('astro')) intervalTime = 6200;
    if (slideshow.classList.contains('music')) intervalTime = 9300;

    // stagger start by index * 500ms
    setTimeout(() => {
      setInterval(() => {
        current = (current + 1) % slides.length;
        showSlide(current);
      }, intervalTime);
    }, index * 500);
  });

  const blackBoxFill = document.getElementById("blackBoxFill");
  const boxBtns = document.querySelectorAll(".BoxBtn");

  boxBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      blackBoxFill.style.display = "block";
      requestAnimationFrame(() => {
        blackBoxFill.classList.add("expand");
      });
      setTimeout(() => {
        window.location.href = btn.href;
      }, 1100);
    });
  });
});

// Goals reveal on scroll
document.addEventListener("DOMContentLoaded", () => {
  const reveals = document.querySelectorAll("#goalsContainer .reveal");

  function revealOnScroll() {
    const windowHeight = window.innerHeight;
    reveals.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;
      const elementVisible = 100;
      if (elementTop < windowHeight - elementVisible) {
        el.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();
});

// --- Scroll indicator fade out ---
document.addEventListener("DOMContentLoaded", () => {
  const scrollIndicator = document.getElementById("scrollIndicator");

  function handleScroll() {
    if (window.scrollY > 10) {
      scrollIndicator.style.opacity = "0";       // fade out
      scrollIndicator.style.pointerEvents = "none"; // disable clicks
    } else {
      scrollIndicator.style.opacity = "1";       // show again at top
      scrollIndicator.style.pointerEvents = "auto";
    }
  }

  window.addEventListener("scroll", handleScroll);
});

// --- Live clock ---
function updateClock() {
  const now = new Date();
  document.getElementById("localtime").textContent =
    now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

// --- Weather fetch (Open-Meteo, free, no key) ---
async function updateWeather() {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=5.866&longitude=-55.166&current_weather=true";
  try {
    const res = await fetch(url);
    const data = await res.json();
    const temp = Math.round(data.current_weather.temperature);
    document.getElementById("temperature").textContent = temp + " °C";
  } catch (err) {
    console.error("Weather fetch failed", err);
    document.getElementById("temperature").textContent = "N/A";
  }
}
updateWeather();
setInterval(updateWeather, 400000);
