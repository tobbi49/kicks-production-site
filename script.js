/*
 * Kicks — site interactivity
 * Nav toggle, scroll animations, etc. to be added here.
 */

/*
 * Motion system: Lenis smooth scroll + GSAP/ScrollTrigger.
 * Fully skipped when the user prefers reduced motion — content stays static.
 */
var KicksMotion = (function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var librariesReady = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined' && typeof window.Lenis !== 'undefined';
  var enabled = !prefersReducedMotion && librariesReady;

  if (enabled) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    var lenis = new window.Lenis();
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    window.gsap.ticker.lagSmoothing(0);
  }

  return {
    enabled: enabled,
    gsap: enabled ? window.gsap : null,
    ScrollTrigger: enabled ? window.ScrollTrigger : null
  };
})();

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

    // TEMP: verification logging — remove once scroll motion is confirmed in a real browser
    console.log('[void-blob] scroll progress:', clamped.toFixed(3));

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

/*
 * Click-to-load YouTube facade. Shared by index.html and work.html — any
 * element carrying [data-yt] renders the auto-thumbnail + a play button, and
 * only swaps in a youtube-nocookie iframe on click. No iframe (and no YouTube
 * request beyond the static thumbnail) until the user chooses to play, so the
 * page stays fast. maxresdefault thumbnails fall back to hqdefault if missing.
 */
(function () {
  function loadYouTube(facade, videoId) {
    if (facade.classList.contains('is-playing')) {
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1';
    iframe.title = 'Video player';
    iframe.allow = 'accelerated-sensors; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

    facade.classList.add('is-playing');
    facade.replaceChildren(iframe);
  }

  document.querySelectorAll('[data-yt]').forEach((facade) => {
    const videoId = facade.dataset.yt;

    // Thumbnail fallback: some videos (esp. Shorts) lack a maxres frame.
    const thumb = facade.querySelector('.yt-thumb');
    if (thumb) {
      thumb.addEventListener('error', function onErr() {
        thumb.removeEventListener('error', onErr);
        thumb.src = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
      });
    }

    facade.addEventListener('click', () => loadYouTube(facade, videoId));
  });
})();

/*
 * Hero split-text reveal on load: wrap each word of the headline in its own
 * span and stagger them in, followed by the subheadline and CTA buttons.
 * Skipped entirely under reduced motion — the plain headline just displays.
 */
(function () {
  if (!KicksMotion.enabled) {
    return;
  }

  const gsap = KicksMotion.gsap;
  const headline = document.querySelector('.hero-headline');
  const subheadline = document.querySelector('.hero-subheadline');
  const heroButtons = document.querySelectorAll('.hero-actions .btn');

  if (!headline) {
    return;
  }

  const text = headline.textContent;
  headline.textContent = '';

  text.split(' ').forEach((word, i, words) => {
    const span = document.createElement('span');
    span.className = 'hero-word';
    span.textContent = word;
    headline.appendChild(span);
    if (i < words.length - 1) {
      headline.appendChild(document.createTextNode(' '));
    }
  });

  const words = headline.querySelectorAll('.hero-word');
  const animatedTargets = [...words, subheadline, ...heroButtons].filter(Boolean);
  gsap.set(animatedTargets, { willChange: 'transform, opacity' });

  const tl = gsap.timeline({
    delay: 0.2,
    onComplete: () => gsap.set(animatedTargets, { willChange: 'auto' })
  });

  tl.from(words, { opacity: 0, y: 40, duration: 0.6, ease: 'power2.out', stagger: 0.05 });

  if (subheadline) {
    tl.from(subheadline, { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out' }, '-=0.25');
  }

  if (heroButtons.length) {
    tl.from(heroButtons, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out', stagger: 0.08 }, '-=0.3');
  }
})();

/*
 * Scroll reveals: heading + content blocks fade/rise into view once per
 * section, with repeated children (cards, items, team members) staggered.
 */
(function () {
  if (!KicksMotion.enabled) {
    return;
  }

  const gsap = KicksMotion.gsap;
  const ScrollTrigger = KicksMotion.ScrollTrigger;

  document.querySelectorAll('[data-reveal]').forEach((section) => {
    const heading = section.querySelector('[data-reveal-heading]');
    const items = section.querySelectorAll('[data-reveal-item]');
    const targets = [heading, ...items].filter(Boolean);

    if (!targets.length) {
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true
      },
      onStart: () => gsap.set(targets, { willChange: 'transform, opacity' }),
      onComplete: () => gsap.set(targets, { willChange: 'auto' })
    });

    if (heading) {
      tl.from(heading, { opacity: 0, y: 40, duration: 0.8, ease: 'power2.out' });
    }

    if (items.length) {
      tl.from(items, { opacity: 0, y: 40, duration: 0.8, ease: 'power2.out', stagger: 0.1 }, heading ? '-=0.5' : 0);
    }
  });

  ScrollTrigger.refresh();
})();

/*
 * Self-drawing SVG doodles: every hand-drawn accent traces its stroke in as
 * it enters the viewport (classic dasharray/dashoffset technique).
 */
(function () {
  if (!KicksMotion.enabled) {
    return;
  }

  const gsap = KicksMotion.gsap;
  const ScrollTrigger = KicksMotion.ScrollTrigger;

  document.querySelectorAll('.accent, .mascot:not(.mascot-hero)').forEach((svg) => {
    const shapes = svg.querySelectorAll('path, circle, rect, polyline, polygon');
    if (!shapes.length) {
      return;
    }

    shapes.forEach((shape) => {
      const length = shape.getTotalLength();
      shape.style.strokeDasharray = length;
      shape.style.strokeDashoffset = length;
    });

    ScrollTrigger.create({
      trigger: svg,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.set(shapes, { willChange: 'stroke-dashoffset' });
        gsap.to(shapes, {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: 'power1.inOut',
          stagger: 0.08,
          onComplete: () => gsap.set(shapes, { willChange: 'auto' })
        });
      }
    });
  });
})();

/*
 * Placeholder-image guard: the scattered accents and trust-bar previews
 * reference asset files that get dropped in separately. Until an image
 * actually loads it stays fully hidden (no stray border line, no broken
 * icon); on a successful load it gets .is-loaded and reveals. On error it
 * is hidden outright. Applies on both index.html and work.html.
 */
(function () {
  document.querySelectorAll('.scatter-img, .trust-preview img, .work-poster').forEach((img) => {
    function markLoaded() {
      img.classList.add('is-loaded');
    }

    function markFailed() {
      img.style.display = 'none';
      const wrap = img.closest('.scatter-img-wrap') || img.closest('.trust-preview');
      if (wrap) {
        wrap.style.display = 'none';
      }
    }

    if (img.complete) {
      if (img.naturalWidth > 0) {
        markLoaded();
      } else {
        markFailed();
      }
    } else {
      img.addEventListener('load', markLoaded);
      img.addEventListener('error', markFailed);
    }
  });
})();

/*
 * Hero mascot: self-draws on page load (not scroll), sequenced to start as
 * the headline word reveal is finishing (~1.2s). Under reduced motion the
 * dashoffset is never touched, so the mascot renders fully drawn and static.
 */
(function () {
  if (!KicksMotion.enabled) {
    return;
  }

  const gsap = KicksMotion.gsap;
  const mascot = document.querySelector('.mascot-hero');

  if (!mascot) {
    return;
  }

  const shapes = mascot.querySelectorAll('path');
  shapes.forEach((shape) => {
    const length = shape.getTotalLength();
    shape.style.strokeDasharray = length;
    shape.style.strokeDashoffset = length;
  });

  gsap.set(shapes, { willChange: 'stroke-dashoffset' });
  gsap.to(shapes, {
    strokeDashoffset: 0,
    duration: 1.3,
    ease: 'power1.inOut',
    stagger: 0.1,
    delay: 1.2,
    onComplete: () => gsap.set(shapes, { willChange: 'auto' })
  });
})();

/*
 * Scattered work images: subtle parallax drift (transform-only) as the
 * page scrolls past them. Hidden on mobile via CSS, so skip wiring there.
 */
(function () {
  if (!KicksMotion.enabled) {
    return;
  }

  const gsap = KicksMotion.gsap;
  const ScrollTrigger = KicksMotion.ScrollTrigger;

  if (window.innerWidth < 768) {
    return;
  }

  document.querySelectorAll('.scatter-img').forEach((img, i) => {
    const range = i % 2 === 0 ? 30 : -30;
    gsap.fromTo(
      img,
      { y: -range },
      {
        y: range,
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.scatter-img-wrap') || img,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  });
})();
