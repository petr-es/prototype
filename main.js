/* ============================================================
   THEME SYSTEM
   ============================================================ */

const THEME_KEY = 'ps-theme';
let currentTheme = localStorage.getItem(THEME_KEY) || 'original';

function applyTheme(theme, save) {
  currentTheme = theme;
  if (save !== false) localStorage.setItem(THEME_KEY, theme);
  document.getElementById('theme-css').href = 'style-' + theme + '.css';
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  if (theme === 'original') initStars();
}

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
});

// Sync active state with saved theme on load
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.theme === currentTheme);
});


/* ============================================================
   CANVAS SETUP
   ============================================================ */

const canvas = document.getElementById('constellation');
const ctx    = canvas.getContext('2d');

let W, H;
let time       = 0;
let scrollY    = 0;
let lastScrollY = 0;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  if (currentTheme === 'original') initStars();
}

window.addEventListener('resize', resize);


/* ============================================================
   ORIGINAL — CONSTELLATION
   ============================================================ */

const STAR_COUNT = 140;
const MAX_DIST   = 160;
const LAYERS     = 3;

let stars = [];

function randomStar() {
  const layer = Math.floor(Math.random() * LAYERS);
  return {
    x:       Math.random() * W,
    y:       Math.random() * H,
    baseX:   0,
    baseY:   0,
    r:       0.4 + Math.random() * 1.4 * ((layer + 1) / LAYERS),
    opacity: 0.2 + Math.random() * 0.7,
    layer,
    drift:   (Math.random() - 0.5) * 0.012,
    phase:   Math.random() * Math.PI * 2,
  };
}

function initStars() {
  stars = Array.from({ length: STAR_COUNT }, () => {
    const s = randomStar();
    s.baseX = s.x;
    s.baseY = s.y;
    return s;
  });
}

function drawConstellation() {
  const offsets = [
    scrollY * 0.04,
    scrollY * 0.09,
    scrollY * 0.17,
  ];

  stars.forEach(s => {
    s.x = s.baseX + Math.sin(time * s.drift + s.phase) * 18;
    s.y = s.baseY - offsets[s.layer];
    if (s.y < -20)  s.y = H + 10;
    if (s.y > H + 20) s.y = -10;
  });

  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const a = stars[i], b = stars[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST) {
        const alpha = (1 - dist / MAX_DIST) * 0.18;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(45, 230, 184, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }

  stars.forEach(s => {
    const twinkle = 0.75 + 0.25 * Math.sin(time * 0.8 + s.phase);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 240, 235, ${s.opacity * twinkle})`;
    ctx.fill();
    if (s.r > 1.0) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(45, 230, 184, ${0.06 * twinkle})`;
      ctx.fill();
    }
  });
}


/* ============================================================
   80s — SYNTHWAVE GRID
   ============================================================ */

let gridOffset   = 0;
let gridVelocity = 0;

function drawSkyStars() {
  const rng = seed => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
  const vpY = H * 0.52;
  for (let i = 0; i < 80; i++) {
    const sx = rng(i * 7.3 + 1) * W;
    const sy = rng(i * 3.7 + 2) * vpY;
    const sr = rng(i * 5.1 + 3) * 1.2;
    const twinkle = 0.4 + 0.4 * Math.sin(time * (0.5 + rng(i * 2.9) * 1.5) + i);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220, 230, 255, ${twinkle * 0.55})`;
    ctx.fill();
    if (sr > 0.8) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(61, 126, 255, ${twinkle * 0.07})`;
      ctx.fill();
    }
  }
}

function drawSynthwave() {
  const vpX = W / 2;
  const vpY = H * 0.52;

  // Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, vpY);
  skyGrad.addColorStop(0, '#060812');
  skyGrad.addColorStop(0.5, '#0a1022');
  skyGrad.addColorStop(1, '#0e1630');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, vpY);

  // Ground
  const groundGrad = ctx.createLinearGradient(0, vpY, 0, H);
  groundGrad.addColorStop(0, '#0d1425');
  groundGrad.addColorStop(1, '#060812');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, vpY, W, H - vpY);

  drawSkyStars();

  // Sun — outer glow
  const sunR  = Math.min(W * 0.09, H * 0.12, 100);
  const sunCY = vpY - sunR * 0.5;

  const glow = ctx.createRadialGradient(vpX, sunCY, sunR * 0.5, vpX, sunCY, sunR * 3.5);
  glow.addColorStop(0,    'rgba(80, 60, 255, 0.22)');
  glow.addColorStop(0.4,  'rgba(0, 160, 200, 0.10)');
  glow.addColorStop(0.75, 'rgba(61, 126, 255, 0.05)');
  glow.addColorStop(1,    'rgba(61, 126, 255, 0)');
  ctx.beginPath();
  ctx.arc(vpX, sunCY, sunR * 3.5, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Sun body — clipped to sky
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, vpY + 1);
  ctx.clip();

  const sunGrad = ctx.createLinearGradient(vpX, sunCY - sunR, vpX, sunCY + sunR);
  sunGrad.addColorStop(0,    '#44aaff');
  sunGrad.addColorStop(0.28, '#5533ee');
  sunGrad.addColorStop(0.62, '#7722cc');
  sunGrad.addColorStop(1,    '#00ccaa');
  ctx.beginPath();
  ctx.arc(vpX, sunCY, sunR, 0, Math.PI * 2);
  ctx.fillStyle = sunGrad;
  ctx.fill();

  // Retro stripe cutouts
  const stripeH = sunR * 0.14;
  ctx.fillStyle = 'rgba(6, 8, 18, 0.55)';
  for (let sy = sunCY - sunR + stripeH * 2.2; sy < sunCY + sunR; sy += stripeH * 2.0) {
    const hw = Math.sqrt(Math.max(0, sunR * sunR - (sy - sunCY) ** 2));
    ctx.fillRect(vpX - hw, sy, hw * 2, stripeH * 0.75);
  }
  ctx.restore();

  // Horizon line — subtle
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, vpY);
  ctx.lineTo(W, vpY);
  ctx.strokeStyle = 'rgba(0, 200, 180, 0.2)';
  ctx.lineWidth = 0.6;
  ctx.shadowBlur = 6;
  ctx.shadowColor = 'rgba(0, 212, 192, 0.4)';
  ctx.stroke();
  ctx.restore();

  // Perspective grid — scroll-driven
  gridVelocity *= 0.88;
  gridOffset = ((gridOffset + gridVelocity) % 1 + 1) % 1;

  const power = 2.3;
  for (let i = 0; i < 18; i++) {
    const t      = ((i / 18) + gridOffset) % 1;
    const perspT = Math.pow(t, power);
    const y      = vpY + perspT * (H - vpY);
    const alpha  = Math.min(0.38, t * 0.5);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.strokeStyle = `rgba(100, 70, 230, ${alpha})`;
    ctx.lineWidth = 0.3 + perspT * 1.4;
    if (perspT > 0.7) { ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(120, 87, 255, 0.5)'; }
    ctx.stroke();
    ctx.restore();
  }

  // Vertical fan lines
  for (let i = 0; i <= 24; i++) {
    const t     = i / 24;
    const alpha = 0.02 + Math.abs(t - 0.5) * 2 * 0.13;
    ctx.beginPath();
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(t * W, H);
    ctx.strokeStyle = `rgba(100, 70, 230, ${alpha})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Teal outer edge lines
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 212, 192, 0.18)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#00d4c0';
  ctx.beginPath(); ctx.moveTo(vpX, vpY); ctx.lineTo(0, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(vpX, vpY); ctx.lineTo(W, H); ctx.stroke();
  ctx.restore();
}


/* ============================================================
   MAIN DRAW LOOP
   ============================================================ */

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (currentTheme === 'original') {
    drawConstellation();
  } else {
    drawSynthwave();
  }
  time += 0.010;
  requestAnimationFrame(draw);
}

resize();
if (currentTheme === 'original') initStars();
draw();


/* ============================================================
   SCROLL — orb parallax + nav glass + grid velocity
   ============================================================ */

const navBar = document.getElementById('nav-bar');
const orbs = [
  { el: document.querySelector('.orb-1'), speedY: 0.12,  speedX: 0.05  },
  { el: document.querySelector('.orb-2'), speedY: -0.08, speedX: -0.06 },
  { el: document.querySelector('.orb-3'), speedY: 0.06,  speedX: 0.03  },
  { el: document.querySelector('.orb-4'), speedY: -0.10, speedX: 0.07  },
];

let ticking = false;

window.addEventListener('scroll', () => {
  const newScrollY = window.scrollY;
  gridVelocity += (newScrollY - lastScrollY) * 0.0003;
  lastScrollY = newScrollY;
  scrollY     = newScrollY;

  if (!ticking) {
    requestAnimationFrame(() => {
      orbs.forEach(({ el, speedY, speedX }) => {
        if (!el) return;
        el.style.transform = `translate(${scrollY * speedX}px, ${scrollY * speedY}px)`;
      });
      navBar.classList.toggle('scrolled', scrollY > 40);
      ticking = false;
    });
    ticking = true;
  }
});


/* ============================================================
   INTERSECTION OBSERVER — reveal on scroll
   ============================================================ */

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


/* ============================================================
   NAV — active link highlight
   ============================================================ */

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color      = '';
          link.style.textShadow = '';
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.style.color = 'var(--accent)';
            if (currentTheme === '80s') {
              link.style.textShadow = '0 0 10px rgba(120, 87, 255, 0.6)';
            }
          }
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach(s => sectionObserver.observe(s));
