/* ═══════════════════════════════════════════════════════
   main.js — Slide Navigation + Interactive Features
   E 300 AMG Line vs 530i M Sport xDrive
═══════════════════════════════════════════════════════ */

/* ── LOADER ─────────────────────────────────────────── */
window.addEventListener('load', function () {
  setTimeout(function () {
    var loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 2000);
});

/* ── HERO CANVAS — 2D PARTICLE FIELD ────────────────── */
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
  particles = [];
  for (var i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
  draw();
  window.addEventListener('resize', resize);
})();

/* ── SLIDE NAVIGATION SYSTEM ────────────────────────── */
var currentSlide = 0;
var isAnimating  = false;
var ANIM_MS      = 650;
var slides       = [];
var totalSlides  = 0;

function initSlides() {
  slides = document.querySelectorAll('.slide');
  totalSlides = slides.length;
  var totalEl = document.getElementById('slideNumTotal');
  if (totalEl) totalEl.textContent = totalSlides;
  updateNavState();
}

function goToSlide(index) {
  if (isAnimating) return;
  if (index < 0 || index >= totalSlides) return;
  if (index === currentSlide) return;

  isAnimating = true;

  var fromEl = slides[currentSlide];
  var toEl   = slides[index];
  var dir    = index > currentSlide ? 1 : -1;

  /* Position the incoming slide off-screen */
  toEl.style.transition = 'none';
  toEl.style.transform  = dir > 0 ? 'translateX(100%)' : 'translateX(-100%)';
  toEl.classList.add('transitioning');

  /* Force reflow */
  toEl.getBoundingClientRect();

  /* Animate */
  fromEl.style.transition = 'transform ' + ANIM_MS + 'ms cubic-bezier(0.77,0,0.175,1)';
  toEl.style.transition   = 'transform ' + ANIM_MS + 'ms cubic-bezier(0.77,0,0.175,1)';

  fromEl.style.transform = dir > 0 ? 'translateX(-100%)' : 'translateX(100%)';
  toEl.style.transform   = 'translateX(0)';

  /* Close feature detail if open */
  closeFeatureDetail();

  setTimeout(function () {
    fromEl.classList.remove('active');
    fromEl.style.transition = '';
    fromEl.style.transform  = '';
    toEl.classList.add('active');
    toEl.classList.remove('transitioning');
    toEl.style.transition = '';

    currentSlide = index;
    isAnimating  = false;
    updateNavState();
    triggerSlideIn(currentSlide);
  }, ANIM_MS);
}

function updateNavState() {
  /* Dots */
  document.querySelectorAll('.ndot').forEach(function(dot) {
    dot.classList.toggle('active', parseInt(dot.dataset.slide) === currentSlide);
  });

  /* Counter */
  var curEl = document.getElementById('slideNumCur');
  if (curEl) curEl.textContent = currentSlide + 1;

  /* Label */
  var labelEl = document.getElementById('navSlideLabel');
  var slide   = slides[currentSlide];
  if (labelEl && slide) labelEl.textContent = slide.dataset.label || '';

  /* Counter display */
  var counterEl = document.getElementById('navCounter');
  if (counterEl) counterEl.textContent = (currentSlide + 1) + ' / ' + totalSlides;

  /* Prev/Next buttons */
  var prevBtn = document.getElementById('slidePrev');
  var nextBtn = document.getElementById('slideNext');
  if (prevBtn) prevBtn.disabled = currentSlide === 0;
  if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
}

/* ── TRIGGER ANIMATIONS WHEN SLIDE ENTERS ───────────── */
var barsAnimated  = {};
var priceAnimated = false;

function triggerSlideIn(index) {
  var slide = slides[index];
  if (!slide) return;

  /* Performance bars (slide 3) */
  if (slide.dataset.slide === '3' && !barsAnimated[3]) {
    barsAnimated[3] = true;
    setTimeout(function() {
      slide.querySelectorAll('.pbr-fill').forEach(function(bar) {
        bar.style.width = bar.dataset.w + '%';
      });
    }, 200);
  }

  /* Price counters (slide 6) */
  if (slide.dataset.slide === '6' && !priceAnimated) {
    priceAnimated = true;
    setTimeout(function() {
      slide.querySelectorAll('.pn-amount').forEach(function(el) {
        animateCounter(el, parseInt(el.dataset.target, 10));
      });
    }, 300);
  }
}

/* ── PRICE COUNTER ───────────────────────────────────── */
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

/* ── KEYBOARD NAVIGATION ─────────────────────────────── */
document.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    goToSlide(currentSlide + 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    goToSlide(currentSlide - 1);
  } else if (e.key === 'Escape') {
    closeFeatureDetail();
  }
});

/* ── MOUSE WHEEL NAVIGATION ──────────────────────────── */
var wheelCooldown = false;
window.addEventListener('wheel', function (e) {
  /* Allow internal scroll on scrollable slides */
  var activeSlide = slides[currentSlide];
  if (activeSlide && activeSlide.classList.contains('slide-scrollable')) {
    var inner = activeSlide.querySelector('.slide-body-scroll');
    if (inner) {
      var atTop    = inner.scrollTop <= 0;
      var atBottom = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 2;
      if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
    }
  }
  if (wheelCooldown) return;
  wheelCooldown = true;
  setTimeout(function() { wheelCooldown = false; }, 900);
  if (e.deltaY > 30)  goToSlide(currentSlide + 1);
  if (e.deltaY < -30) goToSlide(currentSlide - 1);
}, { passive: true });

/* ── TOUCH SWIPE NAVIGATION ──────────────────────────── */
var touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', function (e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', function (e) {
  var dx = touchStartX - e.changedTouches[0].clientX;
  var dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    goToSlide(currentSlide + (dx > 0 ? 1 : -1));
  }
}, { passive: true });

/* ── ARROW BUTTON LISTENERS ──────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initSlides();

  var prevBtn = document.getElementById('slidePrev');
  var nextBtn = document.getElementById('slideNext');
  if (prevBtn) prevBtn.addEventListener('click', function() { goToSlide(currentSlide - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { goToSlide(currentSlide + 1); });

  var heroNext = document.getElementById('heroNextBtn');
  if (heroNext) heroNext.addEventListener('click', function() { goToSlide(1); });

  /* Navigation dots */
  document.querySelectorAll('.ndot').forEach(function(dot) {
    dot.addEventListener('click', function() {
      goToSlide(parseInt(dot.dataset.slide));
    });
  });

  /* Mobile menu (burger removed — just dots) */

  /* Feature tabs */
  document.querySelectorAll('.ftab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = btn.dataset.tab;
      document.querySelectorAll('.ftab').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.feat-panel').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      var panel = document.getElementById('fpanel-' + target);
      if (panel) panel.classList.add('active');
      closeFeatureDetail();
    });
  });

  /* Feature item click — open detail bottom sheet */
  document.querySelectorAll('.fitem.clickable').forEach(function(item) {
    item.addEventListener('click', function() {
      var detail  = item.dataset.detail;
      var feature = item.dataset.feature;
      var car     = item.dataset.car;
      if (!detail) return;

      var panel  = document.getElementById('featureDetail');
      var badge  = document.getElementById('fdCarBadge');
      var title  = document.getElementById('fdTitle');
      var desc   = document.getElementById('fdDesc');
      if (!panel || !badge || !title || !desc) return;

      /* Remove active from all items, highlight this one */
      document.querySelectorAll('.fitem.clickable').forEach(function(el) {
        el.classList.remove('fitem-active');
      });
      item.classList.add('fitem-active');

      badge.textContent = car === 'benz' ? '✦ Mercedes-Benz' : '◎ BMW';
      badge.className   = 'fd-car-badge fd-' + car;
      title.textContent = feature;
      desc.textContent  = detail;

      panel.classList.add('open');
    });
  });

  /* Close feature detail */
  var fdClose = document.getElementById('fdClose');
  if (fdClose) fdClose.addEventListener('click', closeFeatureDetail);
});

function closeFeatureDetail() {
  var panel = document.getElementById('featureDetail');
  if (panel) panel.classList.remove('open');
  document.querySelectorAll('.fitem-active').forEach(function(el) {
    el.classList.remove('fitem-active');
  });
}

/* ── FULLSCREEN ──────────────────────────────────────── */
var FS_ICON_EXPAND = '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>';
var FS_ICON_COLLAPSE = '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>';

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(function () {});
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener('fullscreenchange', function () {
  var btn  = document.getElementById('fullscreenBtn');
  var icon = document.getElementById('fsIcon');
  if (!btn || !icon) return;
  if (document.fullscreenElement) {
    btn.title    = '전체화면 해제 (Esc)';
    icon.innerHTML = FS_ICON_COLLAPSE;
  } else {
    btn.title    = '전체화면';
    icon.innerHTML = FS_ICON_EXPAND;
  }
});
