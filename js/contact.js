// Intro / page UI and form logic first
const blackBoxRight = document.getElementById("blackBoxRight");
const whiteBoxRight = document.getElementById("whiteBoxRight");

window.addEventListener("load", () => {
  setTimeout(() => blackBoxRight.classList.add("shrink"), 100);
  setTimeout(() => whiteBoxRight.classList.add("expand"), 1200);
  setTimeout(() => {
    blackBoxRight.classList.add("up");
    whiteBoxRight.classList.add("up");
  }, 1400);

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

  const inputs = document.querySelectorAll("#name, #subject, #email, #message");
  inputs.forEach(input => {
    if (input.value.length === 0) {
      input.style.borderBottomColor = "#ccc";
    }
  });
});

const form = document.getElementById("contactForm");
const nameInput = document.getElementById("name");
const subjectInput = document.getElementById("subject");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");

if (emailInput) {
  emailInput.addEventListener("input", () => {
    const value = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    if (value.length > 0) {
      if (emailRegex.test(value)) {
        emailInput.style.borderBottomColor = "#28a745";
      } else {
        emailInput.style.borderBottomColor = "red";
      }
    } else {
      emailInput.style.borderBottomColor = "#ccc";
    }
  });
}

if (form) {
  form.addEventListener("submit", (e) => {
    let valid = true;

    [nameInput, subjectInput, emailInput, messageInput].forEach(input => {
      input.style.borderBottomColor = "#ccc";
    });

    if (nameInput.value.trim().length < 2) {
      nameInput.style.borderBottomColor = "red";
      valid = false;
    }

    if (subjectInput.value.trim().length < 3) {
      subjectInput.style.borderBottomColor = "red";
      valid = false;
    }

    if (messageInput.value.trim().length < 5) {
      messageInput.style.borderBottomColor = "red";
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    if (!emailRegex.test(emailInput.value.trim())) {
      emailInput.style.borderBottomColor = "red";
      valid = false;
    }

    if (!valid) {
      e.preventDefault();
    }
  });
}

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

// Three.js petal background below
(async function initPetalBackground() {
  try {
    const [THREE, { SVGLoader }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/loaders/SVGLoader.js'),
    ]);

    const container = document.getElementById('petal-bg');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const loader = new SVGLoader();
    const petals = [];

    const NUM_PETALS = 48;
    const FIELD_WIDTH = 12;
    const FIELD_DEPTH = 3;
    const GRID_COLS = 8;
    const GRID_ROWS = 6;
    const SLOT_W = FIELD_WIDTH / GRID_COLS;
    const SLOT_D = FIELD_DEPTH / GRID_ROWS;

    const WIND_SPEED_MIN = 0.05;
    const WIND_SPEED_MAX = 7.5;
    const WRAP_MARGIN = 8;
    const WRAP_LEFT = -FIELD_WIDTH / 2 - WRAP_MARGIN;
    const WRAP_RIGHT = FIELD_WIDTH / 2 + WRAP_MARGIN;
    const WRAP_RANGE = WRAP_RIGHT - WRAP_LEFT;

    const gust = { active: false, start: 0, attack: 0, hold: 0, release: 0, peak: 0 };
    const GUST_CHANCE_PER_SECOND = 0.35;
    let windClockTime = 0;

    function updateWind(delta) {
      windClockTime += delta;

      if (!gust.active && Math.random() < GUST_CHANCE_PER_SECOND * delta) {
        gust.active = true;
        gust.start = windClockTime;
        gust.attack = 0.5 + Math.random() * 0.5;
        gust.hold = 2.5 + Math.random() * 1.5;
        gust.release = 1.0 + Math.random() * 0.8;
        gust.peak = 0.8 + Math.random() * 0.2;
      }

      let gustValue = 0;
      if (gust.active) {
        const elapsed = windClockTime - gust.start;
        const total = gust.attack + gust.hold + gust.release;
        if (elapsed >= total) {
          gust.active = false;
        } else if (elapsed < gust.attack) {
          gustValue = (elapsed / gust.attack) * gust.peak;
        } else if (elapsed < gust.attack + gust.hold) {
          gustValue = gust.peak;
        } else {
          const releaseElapsed = elapsed - gust.attack - gust.hold;
          gustValue = (1 - releaseElapsed / gust.release) * gust.peak;
        }
      }

      const baseline = 0.05 + 0.05 * Math.sin(windClockTime * 0.17);
      return Math.min(1, Math.max(0, baseline + gustValue));
    }

    let windDistance = 0;
    let currentWind = 0;

    function makeFallParams() {
      return {
        fallSpeed: 0.006 + Math.random() * 0.010,
        swayAmp: SLOT_W * (0.12 + Math.random() * 0.08),
        swayFreq: 0.3 + Math.random() * 0.5,
        swayPhase: Math.random() * Math.PI * 2,
        flutterAxis: new THREE.Vector3(Math.random() * 0.3, Math.random() * 0.3, 1).normalize(),
        flutterAmp: 0.6 + Math.random() * 0.5,
        flutterFreq: 0.8 + Math.random() * 0.6,
        flutterPhase: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.4,
        driftFactor: 0.94 + Math.random() * 0.12,
      };
    }

    function resetPetal(p) {
      Object.assign(p, makeFallParams());
      const type = pickType();
      buildPetalMesh(p.mesh, type);
      const scale = (0.11 + Math.random() * 0.08) * type.scaleFit * randomScaleMultiplier(type);
      p.mesh.scale.set(scale, scale, scale);
      p.mesh.position.y = Math.random() * 3 + 6;
      p.mesh.position.z = p.laneZ;
      p.startTime = clock.getElapsedTime();
    }

    const clock = new THREE.Clock();
    let lastT = 0;

    const PETAL_FILES = [
      '/images/flower-1.svg',
      '/images/flower-2.svg',
      '/images/flower-3.svg',
      '/images/flower-4.svg',
      '/images/flower-5.svg',
      '/images/flower-6.svg',
    ];

    const svgColor = new THREE.Color(0x000000);
    const materialFill = new THREE.MeshBasicMaterial({
      color: svgColor,
      side: THREE.DoubleSide,
    });
    const materialOutline = new THREE.LineBasicMaterial({ color: svgColor });

    const EASTER_EGG_FILES = [
      { file: '/images/nik.jpg', scaleRange: [2, 5] },
      { file: '/images/carlos.png', scaleRange: [2, 5] },
    ];
    const EASTER_EGG_CHANCE = 0.015;

    function buildType(data, isEgg) {
      const allShapes = [];
      data.paths.forEach(path => {
        path.toShapes(true).forEach(shape => allShapes.push(shape));
      });

      const tempGeom = new THREE.ExtrudeGeometry(allShapes, { depth: 0.05, bevelEnabled: false });
      tempGeom.computeBoundingBox();
      const bbox = tempGeom.boundingBox;
      const centerX = (bbox.max.x + bbox.min.x) / 2;
      const centerY = (bbox.max.y + bbox.min.y) / 2;
      const scaleFit = 1.0 / Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);

      return { allShapes, tempGeom, centerX, centerY, scaleFit, isEgg, scaleRange: [1, 1] };
    }

    function buildPetalMesh(group, type) {
      while (group.children.length) {
        const child = group.children.pop();
        child.geometry.dispose();
        group.remove(child);
      }

      if (type.isImage) {
        const planeGeom = new THREE.PlaneGeometry(type.planeWidth, type.planeHeight);
        const planeMat = new THREE.MeshBasicMaterial({
          map: type.texture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        group.add(new THREE.Mesh(planeGeom, planeMat));
        return;
      }

      const { allShapes, tempGeom, centerX, centerY } = type;

      const fillGeom = tempGeom.clone();
      fillGeom.translate(-centerX, -centerY, -0.025);
      group.add(new THREE.Mesh(fillGeom, materialFill));

      allShapes.forEach(shape => {
        const points = shape.getPoints();
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        lineGeom.translate(-centerX, -centerY, 0.001);
        group.add(new THREE.Line(lineGeom, materialOutline));
      });
    }

    const textureLoader = new THREE.TextureLoader();

    function buildImageType(texture, scaleRange) {
      if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace;
      const img = texture.image;
      const aspect = img.width / img.height;
      const maxDim = Math.max(aspect, 1);
      return {
        isEgg: true,
        isImage: true,
        texture,
        planeWidth: aspect / maxDim,
        planeHeight: 1 / maxDim,
        scaleFit: 1,
        scaleRange,
      };
    }

    function loadEggFile(entry) {
      const ext = entry.file.split('.').pop().toLowerCase();
      const scaleRange = entry.scaleRange ?? [1, 1];
      if (ext === 'svg') {
        return loader.loadAsync(entry.file).then(data => {
          const type = buildType(data, true);
          type.scaleRange = scaleRange;
          return type;
        });
      }
      return textureLoader.loadAsync(entry.file).then(texture => buildImageType(texture, scaleRange));
    }

    let petalTypes = [];
    let eggTypes = [];

    function pickType() {
      if (eggTypes.length > 0 && Math.random() < EASTER_EGG_CHANCE) {
        return eggTypes[Math.floor(Math.random() * eggTypes.length)];
      }
      return petalTypes[Math.floor(Math.random() * petalTypes.length)];
    }

    function randomScaleMultiplier(type) {
      const [min, max] = type.scaleRange ?? [1, 1];
      return min === max ? min : min + Math.random() * (max - min);
    }

    const petalLoad = Promise.all(
      PETAL_FILES.map(file => loader.loadAsync(file).catch(() => null))
    );
    const eggLoad = Promise.all(
      EASTER_EGG_FILES.map(entry => loadEggFile(entry).catch(() => null))
    );

    Promise.all([petalLoad, eggLoad]).then(([petalResultsRaw, eggResultsRaw]) => {
      petalTypes = petalResultsRaw.filter(r => r !== null).map(data => buildType(data, false));
      eggTypes = eggResultsRaw.filter(r => r !== null);

      if (petalTypes.length === 0) {
        console.warn('Petal background: none of the PETAL_FILES could be loaded — skipping the animation.');
        return;
      }

      const laneIndices = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => i);
      for (let i = laneIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [laneIndices[i], laneIndices[j]] = [laneIndices[j], laneIndices[i]];
      }

      for (let i = 0; i < NUM_PETALS; i++) {
        const type = pickType();
        const group = new THREE.Group();
        buildPetalMesh(group, type);

        const scale = (0.11 + Math.random() * 0.08) * type.scaleFit * randomScaleMultiplier(type);
        group.scale.set(scale, scale, scale);
        group.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        scene.add(group);

        const lane = laneIndices[i % laneIndices.length];
        const col = lane % GRID_COLS;
        const row = Math.floor(lane / GRID_COLS);
        const laneX = -FIELD_WIDTH / 2 + SLOT_W * (col + 0.5);
        const laneZ = -FIELD_DEPTH / 2 + SLOT_D * (row + 0.5) + (Math.random() - 0.5) * SLOT_D * 0.5;

        const p = { mesh: group, laneX, laneZ, startTime: 0 };
        Object.assign(p, makeFallParams());
        group.position.x = laneX;
        group.position.y = Math.random() * 10 - 5;
        group.position.z = laneZ;

        petals.push(p);
      }
    });

    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const delta = t - lastT;
      lastT = t;

      currentWind = updateWind(delta);
      const windSpeedNow = WIND_SPEED_MIN + currentWind * (WIND_SPEED_MAX - WIND_SPEED_MIN);
      windDistance += windSpeedNow * delta;

      petals.forEach(p => {
        const mesh = p.mesh;
        const localT = t - p.startTime;

        mesh.position.y -= p.fallSpeed * (1 + currentWind * 0.15);

        const driftedX = p.laneX - windDistance * p.driftFactor;
        const wrappedX = WRAP_LEFT + (((driftedX - WRAP_LEFT) % WRAP_RANGE) + WRAP_RANGE) % WRAP_RANGE;

        mesh.position.x = wrappedX + Math.sin(localT * p.swayFreq + p.swayPhase) * p.swayAmp;
        mesh.position.z = p.laneZ + Math.sin(localT * p.swayFreq * 0.5 + p.swayPhase) * p.swayAmp * 0.3;

        const flutterFreqNow = p.flutterFreq * (1 + currentWind * 0.8);
        const flutterAmpNow = p.flutterAmp * (1 + currentWind * 0.3);
        const flutterAngle = Math.sin(localT * flutterFreqNow + p.flutterPhase) * flutterAmpNow;
        const q = new THREE.Quaternion().setFromAxisAngle(p.flutterAxis, flutterAngle);
        const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), localT * p.spinSpeed * (1 + currentWind * 0.6));
        mesh.quaternion.copy(spin).multiply(q);

        if (mesh.position.y < -6) {
          resetPetal(p);
        }
      });

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  } catch (err) {
    console.warn('Petal background animation failed to load — page continues without it.', err);
  }
})();
