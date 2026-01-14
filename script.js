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

  // Replace with your email
  const to = "you@example.com";
  const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

  hint.textContent = "Opening your email client…";
  window.location.href = mailto;

  // Optional: clear after
  form.reset();
  setTimeout(() => (hint.textContent = ""), 2500);
});
