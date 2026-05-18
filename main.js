/**
 * main.js — Interactive 3D Car Viewer + UI Animations
 * E 300 AMG Line vs 530i M Sport xDrive
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

/* ── GSAP registration ────────────────────────────────── */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ═══════════════════════════════════════════════════════
   LOADER
═══════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 2000);
});

/* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */
const nav = document.getElementById('nav');
const progress = document.getElementById('navProgress');
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  /* progress bar */
  const scrolled = window.scrollY;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.width = (scrolled / total * 100) + '%';
  /* scrolled class */
  if (nav) nav.classList.toggle('scrolled', scrolled > 50);
});

burger?.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobileMenu?.classList.toggle('open');
});

/* Close mobile menu on link click */
document.querySelectorAll('.mm-link').forEach(a => {
  a.addEventListener('click', () => {
    burger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
  });
});

/* ═══════════════════════════════════════════════════════
   HERO CANVAS — PARTICLE FIELD
═══════════════════════════════════════════════════════ */
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  const PARTICLE_COUNT = 120;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '#c4a45a' : '#1c69d4',
    };
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  let mouseX = W / 2, mouseY = H / 2;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* faint gradient overlay */
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
    grad.addColorStop(0, 'rgba(30,20,50,0.3)');
    grad.addColorStop(1, 'rgba(6,6,10,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    particles.forEach((p, i) => {
      /* gentle attraction toward mouse */
      const dx = mouseX - p.x, dy = mouseY - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 200) {
        p.vx += dx * 0.00006;
        p.vy += dy * 0.00006;
      }

      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.995; p.vy *= 0.995;

      /* wrap */
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      /* draw */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();

      /* connect nearby */
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const ex = p.x - q.x, ey = p.y - q.y;
        const d  = Math.sqrt(ex*ex + ey*ey);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.globalAlpha = (1 - d/100) * 0.12;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  resize();
  initParticles();
  draw();
  window.addEventListener('resize', () => { resize(); });
})();

/* ═══════════════════════════════════════════════════════
   THREE.JS CAR HELPERS
═══════════════════════════════════════════════════════ */

function createCarMaterial(color, roughness = 0.18) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.92,
    roughness,
    reflectivity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
}

function createGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x6688aa,
    metalness: 0.05,
    roughness: 0.05,
    transmission: 0.75,
    transparent: true,
    opacity: 0.55,
  });
}

function createTireMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95, metalness: 0 });
}

function createRimMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 1.0,
    roughness: 0.12,
    reflectivity: 1,
  });
}

/**
 * Build a stylised sedan from Three.js primitives.
 * carColor   — body paint colour (hex)
 * rimColor   — wheel rim colour (hex)
 * spokeCount — number of rim spokes
 */
function buildCar(carColor, rimColor, spokeCount = 5) {
  const group = new THREE.Group();
  const body  = createCarMaterial(carColor);
  const glass = createGlassMaterial();
  const tire  = createTireMaterial();
  const rim   = createRimMaterial(rimColor);

  /* ── Lower body ── */
  const lowerMesh = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.72, 1.78), body);
  lowerMesh.position.y = 0.52;
  lowerMesh.castShadow = true;
  group.add(lowerMesh);

  /* ── Front section (hood) ── */
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 1.75), body);
  hood.position.set(1.9, 0.74, 0);
  hood.rotation.z = -0.08;
  hood.castShadow = true;
  group.add(hood);

  /* ── Rear section (trunk) ── */
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 1.74), body);
  trunk.position.set(-1.86, 0.74, 0);
  trunk.castShadow = true;
  group.add(trunk);

  /* ── Cabin (roof) ── */
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.58, 1.66), body);
  cabin.position.set(-0.18, 1.17, 0);
  cabin.castShadow = true;
  group.add(cabin);

  /* ── Windshield ── */
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 1.55), glass);
  windshield.position.set(0.68, 1.12, 0);
  windshield.rotation.z = 0.6;
  group.add(windshield);

  /* ── Rear window ── */
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 1.55), glass);
  rearWindow.position.set(-1.08, 1.1, 0);
  rearWindow.rotation.z = -0.55;
  group.add(rearWindow);

  /* ── Side windows ── */
  [-0.05, -0.5, -0.85].forEach((xOff, i) => {
    const w = [0.7, 0.5, 0.35][i];
    [0.85, -0.85].forEach(z => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(w, 0.33, 0.05), glass);
      sw.position.set(xOff, 1.18, z);
      group.add(sw);
    });
  });

  /* ── Headlights (emissive) ── */
  const headLightMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, emissive: 0xfff0cc, emissiveIntensity: 2.5,
    metalness: 0.5, roughness: 0.1,
  });
  [0.7, -0.7].forEach(z => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.3), headLightMat);
    hl.position.set(2.07, 0.6, z);
    group.add(hl);
  });

  /* ── Taillights (emissive red) ── */
  const tailLightMat = new THREE.MeshPhysicalMaterial({
    color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 2,
    metalness: 0.3, roughness: 0.2,
  });
  [0.7, -0.7].forEach(z => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.35), tailLightMat);
    tl.position.set(-2.04, 0.62, z);
    group.add(tl);
  });

  /* ── Wheels ── */
  const wheelPositions = [
    [1.3,  0, 0.96],
    [1.3,  0, -0.96],
    [-1.3, 0, 0.96],
    [-1.3, 0, -0.96],
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    /* Tyre */
    const tyreMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.14, 16, 36),
      tire
    );
    tyreMesh.rotation.x = Math.PI / 2;
    tyreMesh.castShadow = true;
    wheelGroup.add(tyreMesh);

    /* Disc (brake/rim face) */
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.02, 32),
      rim
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.z = z > 0 ? 0.075 : -0.075;
    wheelGroup.add(disc);

    /* Spokes */
    for (let s = 0; s < spokeCount; s++) {
      const angle  = (s / spokeCount) * Math.PI * 2;
      const spoke  = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.5, 0.025),
        rim
      );
      spoke.rotation.z = angle;
      spoke.position.z = z > 0 ? 0.075 : -0.075;
      wheelGroup.add(spoke);
    }

    /* Hub cap */
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16),
      rim
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.z = z > 0 ? 0.085 : -0.085;
    wheelGroup.add(hub);

    group.add(wheelGroup);
  });

  /* ── Floor shadow plane ── */
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 2.2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.01;
  group.add(shadow);

  return group;
}

/* ═══════════════════════════════════════════════════════
   THREE.JS SCENE SETUP
═══════════════════════════════════════════════════════ */

function buildScene(canvasId, carColor, rimColor, spokeCount, glowColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070709);
  scene.fog = new THREE.FogExp2(0x070709, 0.06);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(5.5, 2.6, 4.0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;
  controls.minDistance = 4;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 0.5, 0);

  /* stop auto-rotate on user interaction */
  canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });

  /* ── Lighting ── */
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xb0c8ff, 0x302010, 0.6);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff5e0, 1.8);
  sun.position.set(6, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 30;
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
  sun.shadow.camera.top  = 4;  sun.shadow.camera.bottom = -4;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x8090ff, 0.5);
  fill.position.set(-5, 4, -4);
  scene.add(fill);

  const rim = new THREE.SpotLight(0xffffff, 1.2, 20, Math.PI / 8, 0.4);
  rim.position.set(-3, 8, -3);
  rim.target.position.set(0, 0, 0);
  scene.add(rim);
  scene.add(rim.target);

  /* ── Glow point beneath car ── */
  const glowLight = new THREE.PointLight(new THREE.Color(glowColor), 1.5, 5);
  glowLight.position.set(0, -0.2, 0);
  scene.add(glowLight);

  /* ── Floor ── */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({
      color: 0x07070c,
      metalness: 0.4,
      roughness: 0.6,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ── Grid lines on floor ── */
  const gridHelper = new THREE.GridHelper(20, 20, glowColor, 0x111118);
  gridHelper.position.y = 0.001;
  gridHelper.material.opacity = 0.2;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  /* ── Car ── */
  const car = buildCar(carColor, 0xd0d0d8, spokeCount);
  car.position.y = 0.38;
  car.rotation.y = -Math.PI * 0.15;
  car.castShadow = true;
  scene.add(car);

  /* ── Resize handling ── */
  function onResize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);
  onResize();

  /* ── Animate ── */
  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  /* ── Intersection Observer: pause when off screen ── */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (!raf) animate();
        } else {
          cancelAnimationFrame(raf);
          raf = null;
        }
      });
    },
    { threshold: 0.1 }
  );
  observer.observe(canvas);

  return { renderer, scene, camera, controls };
}

/* ── Build both scenes ── */
buildScene('benzCanvas', 0x1a1a1a, 0xb8a060, 5, '#c4a45a');  /* Obsidian, AMG 5-spoke */
buildScene('bmwCanvas',  0x2c3540, 0x222428, 10, '#1c69d4'); /* Brooklyn Grey, M 10-spoke */

/* ═══════════════════════════════════════════════════════
   AOS — ANIMATION ON SCROLL
═══════════════════════════════════════════════════════ */
const aosItems = document.querySelectorAll('[data-aos]');

const aosObserver = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('aos-in');
        aosObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);

aosItems.forEach(el => aosObserver.observe(el));

/* ═══════════════════════════════════════════════════════
   PERFORMANCE BARS ANIMATION
═══════════════════════════════════════════════════════ */
const barObserver = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.pbr-fill').forEach(bar => {
          const w = bar.dataset.w;
          bar.style.width = w + '%';
        });
        barObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.3 }
);

document.querySelectorAll('.perf-item').forEach(item => barObserver.observe(item));

/* ═══════════════════════════════════════════════════════
   PRICE COUNTER ANIMATION
═══════════════════════════════════════════════════════ */
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); /* ease-out cubic */
    el.textContent = Math.round(ease * target).toLocaleString('ko-KR');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.pn-amount').forEach(el => {
          animateCounter(el, parseInt(el.dataset.target, 10));
        });
        counterObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.4 }
);

const priceSection = document.getElementById('price');
if (priceSection) counterObserver.observe(priceSection);

/* ═══════════════════════════════════════════════════════
   FEATURE TABS
═══════════════════════════════════════════════════════ */
const tabBtns   = document.querySelectorAll('.ftab');
const tabPanels = document.querySelectorAll('.feat-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const panel = document.getElementById('fpanel-' + target);
    if (panel) {
      panel.classList.add('active');
      /* re-trigger AOS inside the panel */
      panel.querySelectorAll('[data-aos]').forEach(el => {
        el.classList.remove('aos-in');
        requestAnimationFrame(() => el.classList.add('aos-in'));
      });
    }
  });
});

/* ═══════════════════════════════════════════════════════
   SMOOTH SECTION HIGHLIGHTING IN NAV
═══════════════════════════════════════════════════════ */
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section[id]');

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach(a => {
          a.style.color = a.getAttribute('href') === '#' + id
            ? 'var(--text-1)' : '';
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach(s => sectionObserver.observe(s));
