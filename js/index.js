// Element references
const loader = document.getElementById("loader");
const maskBox = document.getElementById("maskBox");
const whiteBox = document.getElementById("whiteBox");
const homepage = document.getElementById("homepage");
const welcomeText = document.getElementById("welcomeText");
const roleText = document.getElementById("roleText");
const passionText = document.getElementById("passionText");
const BlackBox = document.getElementById("BlackBox");
const navBar = document.getElementById("navBar");
const skipBtn = document.getElementById("skipBtn");
const logo = document.getElementById("logo");
const bottomLogo = document.getElementById("bottomLogo"); // new bottom logo
const blackBoxRight = document.getElementById("blackBoxRight");
const boxBtns = document.querySelectorAll(".BoxBtn");

let value = 0;
let interval;

// Loader counter sequence
setTimeout(() => {
  loader.classList.add("pop");
  skipBtn.classList.add("pop");

  setTimeout(() => {
    interval = setInterval(() => {
      value++;
      loader.textContent = value;
      if (value === 100) {
        clearInterval(interval);
        setTimeout(() => runSequence(), 800);
      }
    }, 26);
  }, 800);
}, 500);

// Main reveal sequence
function runSequence() {
  loader.classList.remove("pop");
  loader.classList.add("down");
  skipBtn.classList.remove("pop");
  skipBtn.classList.add("down");

  setTimeout(() => {
    maskBox.style.display = "none";
    whiteBox.classList.add("seventy");

    setTimeout(() => {
      whiteBox.classList.add("expand1");

      setTimeout(() => {
        whiteBox.classList.add("expand2");
        BlackBox.classList.add("pop");
        homepage.style.opacity = "1";   // show homepage
        logo.classList.add("pop");      // reveal corner logo

        // Animate texts in sequence
        setTimeout(() => welcomeText.classList.add("pop"), 500);
        setTimeout(() => roleText.classList.add("pop"), 800);
        setTimeout(() => passionText.classList.add("pop"), 1100);
        setTimeout(() => navBar.classList.add("pop"), 1500);

        // Animate bottom logo
        if (bottomLogo) {
          setTimeout(() => bottomLogo.classList.add("pop"), 1700);
        }

        whiteBox.style.zIndex = "5";
        whiteBox.style.background = "transparent";

        if (blackBoxRight) blackBoxRight.style.display = "none";

      }, 1800);
    }, 1600);
  }, 600);
}

// Skip button handler
skipBtn.addEventListener("click", () => {
  clearInterval(interval);
  runSequence();
});

// Navigation buttons with blackBoxRight transition
boxBtns.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault(); // stop immediate navigation

    // Show black box and animate
    blackBoxRight.style.display = "block";
    requestAnimationFrame(() => {
      blackBoxRight.classList.add("expand");
    });

    // After animation completes, navigate to the clicked link
    setTimeout(() => {
      window.location.href = btn.href;
    }, 1100); // matches CSS transition duration
  });
});
