// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

function setNav(open) {
  navMenu.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

navToggle?.addEventListener("click", () => {
  setNav(!navMenu.classList.contains("open"));
});

// Close nav after clicking a link (mobile)
document.querySelectorAll(".nav__link").forEach((link) => {
  link.addEventListener("click", () => setNav(false));
});

// Close nav on outside click (mobile)
document.addEventListener("click", (e) => {
  if (!navMenu.classList.contains("open")) return;
  const clickedInside = navMenu.contains(e.target) || navToggle.contains(e.target);
  if (!clickedInside) setNav(false);
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Projects: search + filter
const projectSearch = document.getElementById("projectSearch");
const projectFilter = document.getElementById("projectFilter");
const projectGrid = document.getElementById("projectGrid");

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function applyProjectFilters() {
  const q = normalize(projectSearch?.value);
  const filter = projectFilter?.value || "all";

  const cards = projectGrid?.querySelectorAll(".project") || [];
  cards.forEach((card) => {
    const title = normalize(card.querySelector(".project__title")?.textContent);
    const text = normalize(card.textContent);
    const tags = normalize(card.getAttribute("data-tags"));

    const matchesQuery = !q || title.includes(q) || text.includes(q);
    const matchesFilter = filter === "all" || tags.split(" ").includes(filter);

    card.style.display = matchesQuery && matchesFilter ? "" : "none";
  });
}

projectSearch?.addEventListener("input", applyProjectFilters);
projectFilter?.addEventListener("change", applyProjectFilters);
applyProjectFilters();

// Contact form: mailto builder (no backend required)
const form = document.getElementById("contactForm");
const hint = document.getElementById("formHint");

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = data.get("name");
  const email = data.get("email");
  const message = data.get("message");

  const subject = encodeURIComponent(`Portfolio Contact — ${name}`);
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`
  );

  // Sends to Sriram's inbox
  const to = "yadagirisriram27@gmail.com";
  const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

  hint.textContent = "Opening your email client…";
  window.location.href = mailto;

  // Optional: clear after
  form.reset();
  setTimeout(() => (hint.textContent = ""), 2500);
});

const backToTopBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 400) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ------------------------------------------------------------------
// Interactive thread-art background
// A field of "pins" that drift slowly and string themselves together
// whenever they're near each other or near the cursor — a nod to the
// Thread Art project, running quietly behind the whole site.
// ------------------------------------------------------------------
(function () {
  const canvas = document.getElementById("threadCanvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let w, h, dpr;
  let pins = [];

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePins() {
    const density = 22000; // px^2 per pin, tuned to stay subtle
    const count = Math.max(24, Math.min(90, Math.floor((w * h) / density)));
    pins = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      kx: 0, // temporary "kicked" velocity from click impulses, decays away
      ky: 0,
    }));
  }

  sizeCanvas();
  makePins();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeCanvas();
      makePins();
    }, 150);
  });

  const mouse = { x: null, y: null, active: false };
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener("pointerleave", () => {
    mouse.active = false;
  });
  window.addEventListener("blur", () => {
    mouse.active = false;
  });

  const LINK_DIST = 130;
  const MOUSE_DIST = 190;
  const BLUE = "115,150,255";
  const PINK = "255,120,180";
  const WHITE = "255,255,255";

  // shooting stars — occasional streaks across the sky
  let shootingStars = [];
  let nextStarAt = reduceMotion ? Infinity : performance.now() + rand(3000, 7000);

  // particle bursts from a star hitting a card/panel
  let particles = [];

  // expanding "charge up" rings from a click
  let pulses = [];

  // elements a shooting star can crash into
  const COLLIDABLE_SELECTOR = ".card, .hero__card, .header";
  let collidableRects = [];
  let rectRefreshCounter = 0;

  function refreshCollidableRects() {
    collidableRects = Array.from(
      document.querySelectorAll(COLLIDABLE_SELECTOR)
    ).map((el) => ({ el, rect: el.getBoundingClientRect() }));
  }
  refreshCollidableRects();
  window.addEventListener("resize", refreshCollidableRects);

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnShootingStar() {
    const dir = Math.random() < 0.5 ? 1 : -1; // left-to-right or right-to-left
    const startX = dir === 1 ? -60 : w + 60;
    const startY = rand(0, h * 0.5);
    const speed = rand(10, 16);
    const slope = rand(0.25, 0.45);
    shootingStars.push({
      x: startX,
      y: startY,
      vx: dir * speed,
      vy: speed * slope,
      len: rand(70, 130),
      color: Math.random() < 0.5 ? BLUE : PINK,
    });
  }

  function spawnShootingStarFrom(x, y, color) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(10, 16);
    shootingStars.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: rand(70, 130),
      color: color || (Math.random() < 0.5 ? BLUE : PINK),
    });
  }

  // pushes nearby pins away from (x, y) — closer pins get a stronger shove
  function pushPinsFrom(x, y, radius = 220, maxForce = 6) {
    for (const p of pins) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy) || 0.001;
      if (dist < radius) {
        const force = (1 - dist / radius) * maxForce;
        p.kx += (dx / dist) * force;
        p.ky += (dy / dist) * force;
      }
    }
  }

  function spawnPulse(x, y, color) {
    pulses.push({ x, y, color, start: performance.now(), duration: 320, maxRadius: 60 });
  }

  function updateAndDrawPulses(now) {
    pulses = pulses.filter((p) => now - p.start < p.duration);
    for (const p of pulses) {
      const t = (now - p.start) / p.duration;
      const eased = 1 - Math.pow(1 - t, 2); // ease-out
      const radius = p.maxRadius * eased;
      const alpha = (1 - t) * 0.65;

      ctx.strokeStyle = `rgba(${p.color},${alpha.toFixed(3)})`;
      ctx.lineWidth = 2 * (1 - t) + 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function hitTestElement(x, y) {
    for (const { el, rect } of collidableRects) {
      if (rect.width === 0 || rect.height === 0) continue;
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return el;
      }
    }
    return null;
  }

  // flashes a brief "force field" shimmer on the DOM element that got hit
  function triggerForceField(el, colorRgb) {
    if (!el) return;
    el.style.setProperty("--ff-rgb", colorRgb);
    el.classList.remove("force-field-hit");
    void el.offsetWidth; // reflow, so re-adding the class restarts the animation
    el.classList.add("force-field-hit");
  }

  function explode(x, y, color) {
    const count = Math.floor(rand(14, 22));
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.5, 5.5);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: rand(30, 55),
        size: rand(1, 2.6),
        color: Math.random() < 0.35 ? WHITE : color,
      });
    }
  }

  function updateAndDrawParticles() {
    particles = particles.filter((p) => p.life < p.maxLife);
    for (const p of particles) {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.vy += 0.03; // slight gravity drift

      const t = p.life / p.maxLife;
      const alpha = 1 - t;
      ctx.fillStyle = `rgba(${p.color},${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function updateAndDrawShootingStars(now) {
    if (reduceMotion) return;

    if (now >= nextStarAt && shootingStars.length < 2) {
      spawnShootingStar();
      nextStarAt = now + rand(4000, 9000);
    }

    rectRefreshCounter++;
    if (rectRefreshCounter % 12 === 0) refreshCollidableRects();

    shootingStars = shootingStars.filter((s) => {
      s.x += s.vx;
      s.y += s.vy;

      const hitEl = hitTestElement(s.x, s.y);
      if (hitEl) {
        explode(s.x, s.y, s.color);
        triggerForceField(hitEl, s.color);
        return false; // remove star, it just crashed
      }

      return s.x > -150 && s.x < w + 150 && s.y < h + 150;
    });

    for (const s of shootingStars) {
      const angle = Math.atan2(s.vy, s.vx);
      const tailX = s.x - Math.cos(angle) * s.len;
      const tailY = s.y - Math.sin(angle) * s.len;

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, `rgba(${s.color},0)`);
      grad.addColorStop(1, "rgba(255,255,255,0.95)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    updateAndDrawParticles();
  }

  function frame(timeArg) {
    const now = typeof timeArg === "number" ? timeArg : performance.now();
    ctx.clearRect(0, 0, w, h);

    if (!reduceMotion) {
      for (const p of pins) {
        p.x += p.vx + p.kx;
        p.y += p.vy + p.ky;
        p.kx *= 0.9;
        p.ky *= 0.9;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
    }

    // thread between nearby pins
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const a = pins[i];
        const b = pins[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * 0.16;
          ctx.strokeStyle = `rgba(${(i + j) % 2 === 0 ? BLUE : PINK},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // the pins themselves
    ctx.fillStyle = "rgba(232,236,245,0.4)";
    for (const p of pins) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // thread from cursor to nearby pins — you're pulling the string
    if (mouse.active && mouse.x != null) {
      for (const p of pins) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_DIST) {
          const alpha = (1 - dist / MOUSE_DIST) * 0.45;
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    updateAndDrawShootingStars(now);
    updateAndDrawPulses(now);

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  document.addEventListener("click", (e) => {
    if (reduceMotion) return;
    const target = e.target;
    // don't hijack clicks on cards/panels/header or interactive controls
    if (target.closest(COLLIDABLE_SELECTOR)) return;
    if (target.closest("a, button, input, textarea, select, label")) return;

    const x = e.clientX;
    const y = e.clientY;
    const color = Math.random() < 0.5 ? BLUE : PINK;

    pushPinsFrom(x, y);
    spawnPulse(x, y, color);

    // let the pulse "charge up" for a beat, then the star is born and fires off
    setTimeout(() => {
      spawnShootingStarFrom(x, y, color);
    }, 260);
  });

  frame();
  if (reduceMotion) {
    // Redraw once on pointer move so the cursor-thread still works
    // for users who opted out of continuous motion.
    window.addEventListener("pointermove", frame);
  }
})();