/*
 * Kicks — site interactivity
 * Nav toggle, scroll animations, etc. to be added here.
 */

(function () {
  const header = document.getElementById('header');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  function handleScroll() {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', handleScroll);
  handleScroll();

  function closeMobileNav() {
    mobileNav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  navToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });
})();

(function () {
  const blob = document.getElementById('void-blob');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!blob || prefersReducedMotion) {
    return;
  }

  function lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  let ticking = false;

  function updateBlob() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    const clamped = Math.min(Math.max(progress, 0), 1);

    const scale = lerp(0.8, 1.4, clamped);
    const radius = lerp(50, 30, clamped);
    const drift = lerp(-15, 15, clamped);

    blob.style.transform = `translate(-50%, calc(-50% + ${drift}vh)) scale(${scale})`;
    blob.style.borderRadius = `${radius}%`;

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateBlob);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateBlob();
})();
