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
