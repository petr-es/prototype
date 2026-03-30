/* ============================================================
   CONSTELLATION CANVAS
   ============================================================ */

const canvas = document.getElementById('constellation');
const ctx    = canvas.getContext('2d');

const STAR_COUNT  = 140;
const MAX_DIST    = 160;   // px — max distance to draw a line
const LAYERS      = 3;     // parallax depth layers

let W, H, stars = [];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function randomStar() {
  const layer = Math.floor(Math.random() * LAYERS);  // 0 = far, 2 = near
  return {
    x:       Math.random() * W,
    y:       Math.random() * H,
    baseX:   0,   // set after creation
    baseY:   0,
    r:       0.4 + Math.random() * 1.4 * ((layer + 1) / LAYERS),
    opacity: 0.2 + Math.random() * 0.7,
    layer,
    // subtle per-star drift over time
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

let scrollY = 0;
let time    = 0;

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Parallax offset per layer — deeper layers move less
  const offsets = [
    scrollY * 0.04,
    scrollY * 0.09,
    scrollY * 0.17,
  ];

  // Update star positions
  stars.forEach(s => {
    s.x = s.baseX + Math.sin(time * s.drift + s.phase) * 18;
    s.y = s.baseY - offsets[s.layer];

    // wrap vertically so stars re-enter from top when scrolling
    if (s.y < -20)  s.y = H + 10;
    if (s.y > H + 20) s.y = -10;
  });

  // Draw edges (constellation lines)
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
        ctx.lineWidth   = 0.6;
        ctx.stroke();
      }
    }
  }

  // Draw stars
  stars.forEach(s => {
    // subtle twinkle
    const twinkle = 0.75 + 0.25 * Math.sin(time * 0.8 + s.phase);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 240, 235, ${s.opacity * twinkle})`;
    ctx.fill();

    // glow halo on larger stars
    if (s.r > 1.0) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(45, 230, 184, ${0.06 * twinkle})`;
      ctx.fill();
    }
  });

  time += 0.008;
  requestAnimationFrame(draw);
}

window.addEventListener('resize', () => { resize(); initStars(); });
resize();
initStars();
draw();


/* ============================================================
   SCROLL — orb parallax + nav glass
   ============================================================ */

const navBar = document.getElementById('nav-bar');
const orbs = [
  { el: document.querySelector('.orb-1'), speedY: 0.12, speedX: 0.05 },
  { el: document.querySelector('.orb-2'), speedY: -0.08, speedX: -0.06 },
  { el: document.querySelector('.orb-3'), speedY: 0.06, speedX: 0.03 },
  { el: document.querySelector('.orb-4'), speedY: -0.10, speedX: 0.07 },
];

let ticking = false;

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;

  if (!ticking) {
    requestAnimationFrame(() => {
      // orb parallax
      orbs.forEach(({ el, speedY, speedX }) => {
        if (!el) return;
        el.style.transform = `translate(${scrollY * speedX}px, ${scrollY * speedY}px)`;
      });

      // nav glass — kicks in after 40px
      if (scrollY > 40) {
        navBar.classList.add('scrolled');
      } else {
        navBar.classList.remove('scrolled');
      }

      ticking = false;
    });
    ticking = true;
  }
});


/* ============================================================
   INTERSECTION OBSERVER — reveal on scroll
   ============================================================ */

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));


/* ============================================================
   NAV — active link highlight
   ============================================================ */

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.style.color = 'var(--accent)';
          }
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach((s) => sectionObserver.observe(s));
