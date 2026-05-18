/**
 * main.js — Interactive 3D Car Viewer + UI Animations
 * E 300 AMG Line vs 530i M Sport xDrive
 * Uses global THREE (r128 CDN) + OrbitControls
 */

/* ═══════════════════════════════════════════════════════
   LOADER
═══════════════════════════════════════════════════════ */
window.addEventListener('load', function () {
  setTimeout(function () {
    var loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 2000);
});

/* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */
var nav       = document.getElementById('nav');
var progress  = document.getElementById('navProgress');
var burger    = document.getElementById('navBurger');
var mobileMenu= document.getElementById('mobileMenu');

window.addEventListener('scroll', function () {
  var scrolled = window.scrollY;
  var total    = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.width = (scrolled / total * 100) + '%';
  if (nav) nav.classList.toggle('scrolled', scrolled > 50);
});

if (burger) {
  burger.addEventListener('click', function () {
    burger.classList.toggle('open');
    if (mobileMenu) mobileMenu.classList.toggle('open');
  });
}

document.querySelectorAll('.mm-link').forEach(function (a) {
  a.addEventListener('click', function () {
    if (burger) burger.classList.remove('open');
    if (mobileMenu) mobileMenu.classList.remove('open');
  });
});

/* ═══════════════════════════════════════════════════════
   HERO CANVAS — PARTICLE FIELD
═══════════════════════════════════════════════════════ */
(function initHeroCanvas() {
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, particles = [];
  var PARTICLE_COUNT = 100;
  var mouseX = 0, mouseY = 0;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    mouseX = W / 2; mouseY = H / 2;
  }

  function createParticle() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.45 + 0.1,
      color: Math.random() > 0.5 ? '#c4a45a' : '#1c69d4'
    };
  }

  function initParticles() {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
  }

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX; mouseY = e.clientY;
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
    grad.addColorStop(0, 'rgba(30,20,50,0.3)');
    grad.addColorStop(1, 'rgba(6,6,10,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var dx = mouseX - p.x, dy = mouseY - p.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 180) { p.vx += dx * 0.00006; p.vy += dy * 0.00006; }
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.995; p.vy *= 0.995;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();

      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var ex = p.x - q.x, ey = p.y - q.y;
        var d  = Math.sqrt(ex*ex + ey*ey);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.globalAlpha = (1 - d/100) * 0.12;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  resize();
  initParticles();
  draw();
  window.addEventListener('resize', resize);
})();

/* ═══════════════════════════════════════════════════════
   THREE.JS 3D CAR VIEWER
═══════════════════════════════════════════════════════ */
function createCarMaterial(color) {
  return new THREE.MeshPhongMaterial({
    color: color,
    shininess: 120,
    specular: new THREE.Color(0x888888),
  });
}

function createGlassMaterial() {
  return new THREE.MeshPhongMaterial({
    color: 0x668899,
    shininess: 200,
    specular: new THREE.Color(0xaaaacc),
    transparent: true,
    opacity: 0.45,
  });
}

function buildCar(carColor, rimColor, spokeCount) {
  var group   = new THREE.Group();
  var bodyMat = createCarMaterial(carColor);
  var glassMat= createGlassMaterial();
  var tireMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  var rimMat  = new THREE.MeshPhongMaterial({
    color: rimColor, shininess: 150, specular: new THREE.Color(0xffffff)
  });

  /* Lower body */
  var lower = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.72, 1.78), bodyMat);
  lower.position.y = 0.52; lower.castShadow = true;
  group.add(lower);

  /* Hood */
  var hood = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.32, 1.75), bodyMat);
  hood.position.set(1.9, 0.72, 0); hood.rotation.z = -0.07; hood.castShadow = true;
  group.add(hood);

  /* Trunk */
  var trunk = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.34, 1.74), bodyMat);
  trunk.position.set(-1.86, 0.72, 0); trunk.castShadow = true;
  group.add(trunk);

  /* Cabin */
  var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.56, 1.66), bodyMat);
  cabin.position.set(-0.18, 1.15, 0); cabin.castShadow = true;
  group.add(cabin);

  /* Windshield */
  var ws = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 1.54), glassMat);
  ws.position.set(0.68, 1.1, 0); ws.rotation.z = 0.6;
  group.add(ws);

  /* Rear window */
  var rw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 1.54), glassMat);
  rw.position.set(-1.08, 1.08, 0); rw.rotation.z = -0.54;
  group.add(rw);

  /* Headlights */
  var hlMat = new THREE.MeshPhongMaterial({
    color: 0xffffff, emissive: new THREE.Color(0xfff5cc), shininess: 200
  });
  [-0.7, 0.7].forEach(function(z) {
    var hl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.28), hlMat);
    hl.position.set(2.06, 0.6, z); group.add(hl);
  });

  /* Taillights */
  var tlMat = new THREE.MeshPhongMaterial({
    color: 0xff2200, emissive: new THREE.Color(0xff2200), shininess: 100
  });
  [-0.7, 0.7].forEach(function(z) {
    var tl = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.17, 0.33), tlMat);
    tl.position.set(-2.03, 0.62, z); group.add(tl);
  });

  /* Wheels */
  var wheelPos = [
    [1.3, 0, 0.96], [1.3, 0, -0.96],
    [-1.3, 0, 0.96], [-1.3, 0, -0.96]
  ];
  wheelPos.forEach(function(pos) {
    var wg = new THREE.Group();
    wg.position.set(pos[0], pos[1], pos[2]);

    /* Tyre */
    var tyre = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.13, 12, 32), tireMat
    );
    tyre.rotation.x = Math.PI / 2;
    tyre.castShadow = true;
    wg.add(tyre);

    /* Disc */
    var disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.29, 0.29, 0.02, 28), rimMat
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.z = pos[2] > 0 ? 0.07 : -0.07;
    wg.add(disc);

    /* Spokes */
    for (var s = 0; s < spokeCount; s++) {
      var angle = (s / spokeCount) * Math.PI * 2;
      var spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.48, 0.024), rimMat
      );
      spoke.rotation.z = angle;
      spoke.position.z = pos[2] > 0 ? 0.072 : -0.072;
      wg.add(spoke);
    }

    /* Hub */
    var hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12), rimMat
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.z = pos[2] > 0 ? 0.08 : -0.08;
    wg.add(hub);

    group.add(wg);
  });

  return group;
}

function buildScene(canvasId, carColor, rimColor, spokeCount, glowHex) {
  var canvas = document.getElementById(canvasId);
  if (!canvas || typeof THREE === 'undefined') return null;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070709);
  scene.fog = new THREE.FogExp2(0x070709, 0.055);

  var W = canvas.clientWidth || 600;
  var H = canvas.clientHeight || 480;
  var camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.set(5.5, 2.6, 4.0);

  var controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;
  controls.minDistance = 4;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(0, 0.5, 0);

  canvas.addEventListener('pointerdown', function () { controls.autoRotate = false; });

  /* Lighting */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  var hemi = new THREE.HemisphereLight(0xb0c8ff, 0x302010, 0.7);
  scene.add(hemi);

  var sun = new THREE.DirectionalLight(0xfff5e0, 1.8);
  sun.position.set(6, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 30;
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
  sun.shadow.camera.top  = 4;  sun.shadow.camera.bottom = -4;
  scene.add(sun);

  var fill = new THREE.DirectionalLight(0x8090ff, 0.5);
  fill.position.set(-5, 4, -4);
  scene.add(fill);

  var glow = new THREE.PointLight(new THREE.Color(glowHex), 1.2, 5);
  glow.position.set(0, -0.2, 0);
  scene.add(glow);

  /* Floor */
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x07070c, metalness: 0.3, roughness: 0.7 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  /* Grid */
  var grid = new THREE.GridHelper(20, 20, new THREE.Color(glowHex), 0x111118);
  grid.position.y = 0.001;
  grid.material.opacity = 0.18;
  grid.material.transparent = true;
  scene.add(grid);

  /* Car */
  var car = buildCar(carColor, rimColor, spokeCount);
  car.position.y = 0.38;
  car.rotation.y = -Math.PI * 0.15;
  scene.add(car);

  /* Resize */
  function onResize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);
  onResize();

  /* Animate */
  var rafId;
  function animate() {
    rafId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  /* Only animate when visible */
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        if (!rafId) animate();
      } else {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  }, { threshold: 0.1 });
  observer.observe(canvas);

  return { renderer: renderer, scene: scene, camera: camera };
}

/* Wait for DOM + CDN scripts to be ready */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof THREE === 'undefined') {
    console.warn('THREE not loaded');
    return;
  }
  buildScene('benzCanvas', 0x1a1a1a, 0xb8a060, 5,  '#c4a45a');
  buildScene('bmwCanvas',  0x2c3540, 0x333438, 10, '#1c69d4');
});

/* ═══════════════════════════════════════════════════════
   AOS — ANIMATE ON SCROLL
═══════════════════════════════════════════════════════ */
var aosObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('aos-in');
      aosObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-aos]').forEach(function(el) {
  aosObserver.observe(el);
});

/* ═══════════════════════════════════════════════════════
   PERFORMANCE BARS
═══════════════════════════════════════════════════════ */
var barObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.pbr-fill').forEach(function(bar) {
        bar.style.width = bar.dataset.w + '%';
      });
      barObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.perf-item').forEach(function(item) {
  barObserver.observe(item);
});

/* ═══════════════════════════════════════════════════════
   PRICE COUNTER
═══════════════════════════════════════════════════════ */
function animateCounter(el, target, duration) {
  duration = duration || 1800;
  var start = performance.now();
  function step(now) {
    var p = Math.min((now - start) / duration, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target).toLocaleString('ko-KR');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

var counterObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.pn-amount').forEach(function(el) {
        animateCounter(el, parseInt(el.dataset.target, 10));
      });
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });

var priceSection = document.getElementById('price');
if (priceSection) counterObserver.observe(priceSection);

/* ═══════════════════════════════════════════════════════
   FEATURE TABS
═══════════════════════════════════════════════════════ */
document.querySelectorAll('.ftab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var target = btn.dataset.tab;
    document.querySelectorAll('.ftab').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.feat-panel').forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
    var panel = document.getElementById('fpanel-' + target);
    if (panel) panel.classList.add('active');
  });
});
