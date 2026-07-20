import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

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

let value = 0;
let interval;

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
        revealActive = true;             // start the flower scale-down
        logo.classList.add("pop");       // reveal the logo in the corner

        setTimeout(() => welcomeText.classList.add("pop"), 500);
        setTimeout(() => roleText.classList.add("pop"), 800);
        setTimeout(() => passionText.classList.add("pop"), 1100);
        setTimeout(() => navBar.classList.add("pop"), 1500);

        whiteBox.style.zIndex = "5";
        whiteBox.style.background = "transparent";

        // Keep About transition box hidden until needed
        const blackBoxRight = document.getElementById("blackBoxRight");
        if (blackBoxRight) blackBoxRight.style.display = "none";

      }, 1800);
    }, 1600);
  }, 600);
}

skipBtn.addEventListener("click", () => {
  clearInterval(interval);
  runSequence();
});

const blackBoxRight = document.getElementById("blackBoxRight");
const boxBtns = document.querySelectorAll(".BoxBtn");

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


/* =====================================================
   Hero canvas: WebGL flower rendered through a
   microscopic rectangular-cell display shader.
   Renders into the existing #heroCanvas element.
===================================================== */

const heroCanvas = document.getElementById("heroCanvas");

function getCanvasSize() {
  // Fall back to the canvas attributes if it isn't laid out yet (e.g. display:none ancestors)
  const w = heroCanvas.clientWidth || heroCanvas.width;
  const h = heroCanvas.clientHeight || heroCanvas.height;
  return { w, h };
}

const { w: heroW0, h: heroH0 } = getCanvasSize();

const renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(heroW0, heroH0, false);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, heroW0 / heroH0, 0.1, 100);
camera.position.z = 10;
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

let flowerGroup = null;
let flowerPivot = null;
let rawFlowerSize = null;

let petals = [];
const PETAL_LAG_STRENGTH_RANGE = [0.09, 0.17];
const PETAL_LAG_DAMPING_RANGE  = [0.60, 0.72];

const svgLoader = new SVGLoader();
svgLoader.load('/img/black.svg', (data) => {
  flowerGroup = new THREE.Group();
  data.paths.forEach(path => {
    const shapes = SVGLoader.createShapes(path);
    shapes.forEach(shape => {
      const geom = new THREE.ShapeGeometry(shape, 128); // higher curve segment count = smoother petal edges
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geom, mat);

      const petalPivot = new THREE.Group();
      petalPivot.add(mesh);
      flowerGroup.add(petalPivot);

      petals.push({
        pivot: petalPivot,
        worldPos: null,
        offsetVel: new THREE.Vector2(0, 0),
        strength: THREE.MathUtils.lerp(PETAL_LAG_STRENGTH_RANGE[0], PETAL_LAG_STRENGTH_RANGE[1], Math.random()),
        damping: THREE.MathUtils.lerp(PETAL_LAG_DAMPING_RANGE[0], PETAL_LAG_DAMPING_RANGE[1], Math.random())
      });
    });
  });

  flowerGroup.scale.set(1, 1, 1);
  flowerGroup.position.set(0, 0, 0);
  const rawBox = new THREE.Box3().setFromObject(flowerGroup);
  const rawCenter = new THREE.Vector3();
  rawBox.getCenter(rawCenter);
  const rawSize = new THREE.Vector3();
  rawBox.getSize(rawSize);
  rawFlowerSize = Math.max(rawSize.x, rawSize.y);

  flowerGroup.position.sub(rawCenter);

  flowerPivot = new THREE.Group();
  flowerPivot.add(flowerGroup);
  scene.add(flowerPivot);
  flowerPivot.matrixAutoUpdate = false;
  updateResponsiveFit();
});

const FLOWER_SCREEN_FRACTION = 0.30;
function updateResponsiveFit() {
  if (!flowerPivot || !rawFlowerSize) return;

  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const frustumHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
  const frustumWidth = frustumHeight * camera.aspect;

  const targetWorldSize = Math.min(frustumWidth, frustumHeight) * FLOWER_SCREEN_FRACTION;
  BASE_SCALE = targetWorldSize / rawFlowerSize;

  const anchorX = -frustumWidth * 0;
  const anchorY = -frustumHeight * 0;
  flowerPivot.position.set(anchorX, anchorY, 0);
  targetPos.set(anchorX, anchorY, 0);
  FLOWER_ANCHOR.set(anchorX, anchorY, 0);
}

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(heroW0, heroH0),
  0.1,
  0.1,
  0.10
);
composer.addPass(bloomPass);

const CellOverlayShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    resolution: { value: new THREE.Vector2(heroW0, heroH0) },

    cellsX: { value: 20.0 },
    lineWidthPixels: { value: 0.01 },
    aspectRatioY: { value: 0.45 },
    separatorStrength: { value: 0.15 },

    glassStrength: { value: 0.15 },

    borderDisplacement: { value: 2 },

    activity: { value: 0.0 },

    gridOffset: { value: new THREE.Vector2(0.585, 0.0) },

    intensity: { value: 1 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform vec2 resolution;

    uniform float cellsX;
    uniform float aspectRatioY;
    uniform float separatorStrength;
    uniform float lineWidthPixels;

    uniform float glassStrength;
    uniform float borderDisplacement;
    uniform float intensity;
    uniform float activity;
    uniform vec2 gridOffset;

    varying vec2 vUv;

    float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    float separatorFactor(float localCoord, float sepWidth) {

      float distToEdge = min(localCoord, 1.0 - localCoord);

      float s = smoothstep(0.0, sepWidth, distToEdge);

      return 1.0 - s;
    }

    void main() {
      vec2 uv = vUv;

      float cellsY = max(1.0, cellsX * aspectRatioY);

      vec2 scaled = vec2(uv.x * cellsX, uv.y * cellsY) + gridOffset;
      vec2 cell = floor(scaled);
      vec2 local = fract(scaled);

      vec2 jitter = (vec2(rand(cell + 1.0), rand(cell + 2.0)) - 0.5) * (0.25 / vec2(cellsX, cellsY));
      vec2 localJ = fract(scaled + jitter);

      float sepWidthX = (lineWidthPixels / resolution.x) * cellsX;
      float sepWidthY = (lineWidthPixels / resolution.y) * cellsY;

      float sepX = separatorFactor(localJ.x, sepWidthX);
      float sepY = separatorFactor(localJ.y, sepWidthY);

      float separator = max(sepX, sepY);

      vec2 centered = localJ - 0.5;
      vec2 centeredAspect = centered * vec2(1.0, 1.0 / aspectRatioY);
      float cellDist = length(centeredAspect);
      float lens = smoothstep(0.0, 0.75, cellDist);
      float blockRand = rand(cell) - 0.5;
      float activeGlassStrength = glassStrength * activity;
      vec2 refract = centered * lens * (activeGlassStrength + blockRand * activeGlassStrength * 0.4);
      vec2 cellSizeUV = vec2(1.0 / cellsX, 1.0 / cellsY);
      vec2 glassUV = refract * cellSizeUV;

      float dirX = sign(localJ.x - 0.5);
      float dirY = sign(localJ.y - 0.5);
      float blockRandB = rand(cell + 3.0) - 0.5;
      float activeBorderDisp = borderDisplacement * activity * (0.7 + blockRandB * 0.6);
      vec2 borderPush = vec2(dirX * sepX, dirY * sepY) * activeBorderDisp;
      vec2 borderUV = borderPush * cellSizeUV;

      vec2 sampleUV = uv + glassUV + borderUV;

      vec4 baseSample = texture2D(tDiffuse, sampleUV);
      vec3 color = baseSample.rgb;

      float activeSeparatorStrength = separatorStrength * activity;
      float darken = 1.0 - activeSeparatorStrength * 0.9 * separator;
      float brighten = 1.0 + activeSeparatorStrength * 0.5 * separator;
      float cornerBoost = pow(separator, 2.0);
      float modFactor = mix(darken, brighten, cornerBoost);

      color *= modFactor;

      vec3 finalColor = color * intensity;
      gl_FragColor = vec4(finalColor, baseSample.a);
    }
  `
};

const cellPass = new ShaderPass(CellOverlayShader);
composer.addPass(cellPass);

const RGBSplitShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount:   { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 offset = vec2(amount, 0.0);
      vec4 cr = texture2D(tDiffuse, vUv - offset);
      vec4 cga = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv + offset);
      gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
    }
  `
};
const rgbPass = new ShaderPass(RGBSplitShader);
composer.addPass(rgbPass);

// FXAA must be the last pass — the other passes render into non-multisampled
// targets, so native antialiasing is lost until this smooths the final edges.
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.set(
  1 / (heroW0 * renderer.getPixelRatio()),
  1 / (heroH0 * renderer.getPixelRatio())
);
composer.addPass(fxaaPass);

// Mouse position tracked relative to the hero canvas itself, not the full window,
// since the canvas no longer fills the viewport.
let mouseX = 0, mouseY = 0;
let prevMouseX = 0, prevMouseY = 0;
let targetPos = new THREE.Vector3(-1.5, -1.5, 0);
let FLOWER_ANCHOR = new THREE.Vector3(-1.5, -1.5, 0);
let lastFastT = 0.0;
let smoothedSpeed = 0;
let smoothedStretch = 0;
let smoothedStretchVel = 0;
let smoothedPop = 1;
let smoothedRadial = 0;

let revealScale = 1.6;    // flower starts at this multiplier when homepage unveils
let revealActive = false;  // set true once runSequence() reveals the homepage

let flowerVel = new THREE.Vector2(0, 0);

let smoothedVel = new THREE.Vector2(0, 0);
const ROTATION_MIN_VEL = 0.0015;
let lastStretchAngle = 0;

const _rot = new THREE.Matrix4();
const _rotInv = new THREE.Matrix4();
const _scale = new THREE.Matrix4();
const _stretchMat = new THREE.Matrix4();
const _posMat = new THREE.Matrix4();

function shortestAngleDelta(a, b) {
  let diff = (b - a) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

const SLOW_SPRING_STRENGTH = 0.012, SLOW_SPRING_DAMPING = 0.90;
const FAST_SPRING_STRENGTH = 0.075, FAST_SPRING_DAMPING = 0.84;

const SETTLE_STRENGTH = 0.035, SETTLE_DAMPING = 0.70;

const AGGRESSIVE_BOOST = 1.0;

let BASE_SCALE = 0.02;
const STRETCH_MAX = 0.32;
const SQUASH_MAX = 0.34;
const STRETCH_VEL_SCALE = 20;
const POP_MAX = 0.035;
const RADIAL_SMOOTH = 0.12;

const STRETCH_WOBBLE_STRENGTH = 0.45;
const STRETCH_WOBBLE_DAMPING = 0.88;
const STRETCH_SETTLE_STRENGTH = 0.06;
const STRETCH_SETTLE_DAMPING = 0.55;

function smoothstepJS(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

const OLD_SPLIT_VALUE = 0.010;
const FADE_SPEED = 0.02;

let activity = 0.0;
const ACTIVITY_SMOOTH = 0.08;

let debugPulse = 0.0;

window.addEventListener('mousemove', (e) => {
  const rect = heroCanvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

function projectToScreen(vec, camera) {
  const { w, h } = getCanvasSize();
  const v = vec.clone().project(camera);
  return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
}
function getFlowerCenterScreen(fg, camera) {
  const { w, h } = getCanvasSize();
  const box = new THREE.Box3().setFromObject(fg);
  const center = box.getCenter(new THREE.Vector3());
  center.project(camera);
  return { x: (center.x * 0.5 + 0.5) * w, y: (-center.y * 0.5 + 0.5) * h };
}

const clock = new THREE.Clock();
function animateHero() {
  requestAnimationFrame(animateHero);
  const t = clock.getElapsedTime();

  cellPass.uniforms.time.value = t;

  if (flowerPivot) {
    const box = new THREE.Box3().setFromObject(flowerPivot);
    const minScreen = projectToScreen(box.min, camera);
    const maxScreen = projectToScreen(box.max, camera);
    const left = Math.min(minScreen.x, maxScreen.x);
    const right = Math.max(minScreen.x, maxScreen.x);
    const top = Math.min(minScreen.y, maxScreen.y);
    const bottom = Math.max(minScreen.y, maxScreen.y);

    const speed = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
    smoothedSpeed += (speed - smoothedSpeed) * 0.25;
    const inside = mouseX >= left - 250 && mouseX <= right + 250 && mouseY >= top - 90 && mouseY <= bottom + 100;
    const moving = inside && smoothedSpeed > 2;

    activity += ((moving ? 1.0 : 0.0) - activity) * ACTIVITY_SMOOTH;
    debugPulse *= 0.94;
    cellPass.uniforms.activity.value = Math.max(activity, debugPulse);

    if (moving) {

      const fastT = smoothstepJS(10, 55, smoothedSpeed);

      const flowerCenter = getFlowerCenterScreen(flowerPivot, camera);
      const aggressiveMul = 1.0 + fastT * AGGRESSIVE_BOOST;
      const offsetX = (mouseX - flowerCenter.x) * 0.0030 * aggressiveMul;
      const offsetY = -(mouseY - flowerCenter.y) * 0.0030 * aggressiveMul;
      targetPos.set(FLOWER_ANCHOR.x + offsetX, FLOWER_ANCHOR.y + offsetY, 0);
      lastFastT += (fastT - lastFastT) * 0.15;

      rgbPass.uniforms.amount.value = OLD_SPLIT_VALUE;

      const springStrength = SLOW_SPRING_STRENGTH + (FAST_SPRING_STRENGTH - SLOW_SPRING_STRENGTH) * lastFastT;
      const springDamping = SLOW_SPRING_DAMPING + (FAST_SPRING_DAMPING - SLOW_SPRING_DAMPING) * lastFastT;

      flowerVel.x += (targetPos.x - flowerPivot.position.x) * springStrength;
      flowerVel.y += (targetPos.y - flowerPivot.position.y) * springStrength;
      flowerVel.x *= springDamping;
      flowerVel.y *= springDamping;
      flowerPivot.position.x += flowerVel.x;
      flowerPivot.position.y += flowerVel.y;
    } else {
      targetPos.set(FLOWER_ANCHOR.x, FLOWER_ANCHOR.y, 0);
      lastFastT += (0.0 - lastFastT) * 0.15;

      rgbPass.uniforms.amount.value = Math.max(0, rgbPass.uniforms.amount.value - FADE_SPEED * 0.03);

      flowerVel.x += (FLOWER_ANCHOR.x - flowerPivot.position.x) * SETTLE_STRENGTH;
      flowerVel.y += (FLOWER_ANCHOR.y - flowerPivot.position.y) * SETTLE_STRENGTH;
      flowerVel.x *= SETTLE_DAMPING;
      flowerVel.y *= SETTLE_DAMPING;
      flowerPivot.position.x += flowerVel.x;
      flowerPivot.position.y += flowerVel.y;
    }

    if (petals.length) {
      const leaderX = flowerPivot.position.x;
      const leaderY = flowerPivot.position.y;
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        if (!p.worldPos) p.worldPos = new THREE.Vector2(leaderX, leaderY);

        const dx = leaderX - p.worldPos.x;
        const dy = leaderY - p.worldPos.y;
        p.offsetVel.x += dx * p.strength;
        p.offsetVel.y += dy * p.strength;
        p.offsetVel.x *= p.damping;
        p.offsetVel.y *= p.damping;
        p.worldPos.x += p.offsetVel.x;
        p.worldPos.y += p.offsetVel.y;

        const localX = (p.worldPos.x - leaderX) / BASE_SCALE;
        const localY = (p.worldPos.y - leaderY) / BASE_SCALE;
        p.pivot.position.set(localX, localY, 0);
      }
    }

    const velMag = Math.hypot(flowerVel.x, flowerVel.y);
    const slowT = 1.0 - lastFastT;

    const posOffX = flowerPivot.position.x - FLOWER_ANCHOR.x;
    const posOffY = flowerPivot.position.y - FLOWER_ANCHOR.y;
    const posOffMag = Math.hypot(posOffX, posOffY);
    let radial = 0;
    if (posOffMag > 0.0001 && velMag > 0.0001) {
      radial = (posOffX * flowerVel.x + posOffY * flowerVel.y) / (posOffMag * velMag);
    }
    smoothedRadial += (radial - smoothedRadial) * RADIAL_SMOOTH;

    const stretchMag = Math.min(velMag * STRETCH_VEL_SCALE, 1.0) * slowT;

    const directional = smoothedRadial >= 0
      ? smoothedRadial * STRETCH_MAX
      : smoothedRadial * SQUASH_MAX;
    const targetStretch = stretchMag * directional;
    const targetPop = 1.0 + Math.min(velMag * STRETCH_VEL_SCALE, 1.0) * POP_MAX * lastFastT;

    if (moving) {
      smoothedStretchVel += (targetStretch - smoothedStretch) * STRETCH_WOBBLE_STRENGTH;
      smoothedStretchVel *= STRETCH_WOBBLE_DAMPING;
    } else {
      smoothedStretchVel += (targetStretch - smoothedStretch) * STRETCH_SETTLE_STRENGTH;
      smoothedStretchVel *= STRETCH_SETTLE_DAMPING;
    }
    smoothedStretch += smoothedStretchVel;

    smoothedPop += (targetPop - smoothedPop) * 0.18;
    const stretchAmount = smoothedStretch;
    const pop = smoothedPop;

    let stretchAngle = lastStretchAngle;
    if (velMag > 0.0001) {
      smoothedVel.x += (flowerVel.x - smoothedVel.x) * 0.2;
      smoothedVel.y += (flowerVel.y - smoothedVel.y) * 0.2;
      const smoothedMag = Math.hypot(smoothedVel.x, smoothedVel.y);

      if (smoothedMag > ROTATION_MIN_VEL) {
        const angle = Math.atan2(smoothedVel.y, smoothedVel.x);
        const delta = shortestAngleDelta(lastStretchAngle, angle);
        stretchAngle = lastStretchAngle + delta * 0.25;
      }
    }
    lastStretchAngle = stretchAngle;

    if (revealActive) {
      revealScale += (1 - revealScale) * 0.025; // lower = slower, more gradual settle
    }

    const sx = BASE_SCALE * (1 + stretchAmount) * pop * revealScale;
    const sy = BASE_SCALE * (1 - stretchAmount * 0.4) * pop * revealScale;

    _rot.makeRotationZ(stretchAngle);
    _rotInv.makeRotationZ(-stretchAngle);
    _scale.makeScale(sx, sy, BASE_SCALE);
    _stretchMat.multiplyMatrices(_rot, _scale).multiply(_rotInv);
    _posMat.makeTranslation(flowerPivot.position.x, flowerPivot.position.y, 0);
    flowerPivot.matrix.multiplyMatrices(_posMat, _stretchMat);
  }

  prevMouseX = mouseX;
  prevMouseY = mouseY;

  composer.render();
}
animateHero();

window.addEventListener('resize', () => {
  const { w, h } = getCanvasSize();
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  cellPass.uniforms.resolution.value.set(w, h);
  bloomPass.setSize(w, h);
  fxaaPass.material.uniforms['resolution'].value.set(
    1 / (w * renderer.getPixelRatio()),
    1 / (h * renderer.getPixelRatio())
  );
  updateResponsiveFit();
});