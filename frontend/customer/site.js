/* ==========================================================================
   A&J's Foodflix — customer site controller
   The only script that drives the shared shell. Replaces global.js, fx.js,
   theme.js, customer-theme.js and home.js's nav code, which used to bind
   competing handlers to the same menu button (one opened it, the next one
   immediately closed it).

   Load order on every page (classic scripts, end of <body>):
     gsap.min.js → ScrollTrigger.min.js → page scripts → cart.js → site.js
   Everything degrades gracefully without GSAP or with reduced motion.
   ========================================================================== */
(() => {
  'use strict';
  if (window.__ajsSite) return;
  window.__ajsSite = true;

  const root = document.documentElement;
  const THEME_KEY = 'ajsFoodflixTheme';
  const NAV_FLAG = 'ajs-nav';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const motion = () => Boolean(gsap) && !reduceMotion.matches;

  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const header = $('[data-ajs-header]');
  const drawer = $('#ajsDrawer');
  const burger = $('#navToggle');
  const curtain = $('.ajs-curtain');

  /* ------------------------------------------------------------------------
     1. Theme
     ------------------------------------------------------------------------ */
  function currentTheme() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function syncThemeControls() {
    const dark = currentTheme() === 'dark';
    $$('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.title = dark ? 'Light theme' : 'Dark theme';
      const label = btn.querySelector('[data-theme-label]');
      if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
    });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#110d0a' : '#faf6f1';
  }

  function setTheme(theme) {
    root.classList.add('ajs-theme-anim');
    root.dataset.theme = theme;
    root.dataset.ajsTheme = theme; // index.css / foodflix.css light-mode rules
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }
    syncThemeControls();
    window.clearTimeout(setTheme.t);
    setTheme.t = window.setTimeout(() => root.classList.remove('ajs-theme-anim'), 500);
  }

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-theme-toggle]');
    if (!btn) return;
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    if (motion()) {
      gsap.fromTo(btn.querySelectorAll('svg'), { rotate: -90, scale: 0.4 }, { rotate: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' });
    }
  });

  // Follow the OS setting until the visitor picks a theme themselves.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
    if (!saved) {
      root.dataset.theme = e.matches ? 'dark' : 'light';
      root.dataset.ajsTheme = root.dataset.theme;
      syncThemeControls();
    }
  });
  syncThemeControls();

  /* ------------------------------------------------------------------------
     2. Header: elevation on scroll, hide on scroll-down, show on scroll-up
     ------------------------------------------------------------------------ */
  let drawerOpen = false;

  if (header) {
    let lastY = window.scrollY;
    let hidden = false;
    let ticking = false;

    const setHidden = (hide) => {
      if (hide === hidden) return;
      hidden = hide;
      if (motion()) {
        gsap.to(header, { yPercent: hide ? -140 : 0, duration: hide ? 0.4 : 0.55, ease: hide ? 'power2.in' : 'power3.out', overwrite: true });
      } else {
        header.style.transform = hide ? 'translateY(-140%)' : '';
      }
    };

    const onScroll = () => {
      ticking = false;
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      if (drawerOpen) { setHidden(false); lastY = y; return; }
      const delta = y - lastY;
      if (y < 140 || delta < -6) setHidden(false);
      else if (delta > 6) setHidden(true);
      lastY = y;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    // Keyboard users tabbing into a hidden header should see it.
    header.addEventListener('focusin', () => setHidden(false));
    onScroll();
  }

  /* ------------------------------------------------------------------------
     3. Desktop nav: a single pill glides between links
     ------------------------------------------------------------------------ */
  const nav = $('.ajs-nav');
  const pill = $('.ajs-nav__pill');
  if (nav && pill && gsap) {
    const links = $$('.ajs-nav__link', nav);
    const active = links.find((a) => a.getAttribute('aria-current') === 'page');

    const moveTo = (link, instant) => {
      if (!link) { gsap.to(pill, { opacity: 0, duration: 0.25 }); return; }
      const navBox = nav.getBoundingClientRect();
      const box = link.getBoundingClientRect();
      const vars = { x: box.left - navBox.left, y: box.top - navBox.top, width: box.width, opacity: 1 };
      if (instant || reduceMotion.matches) gsap.set(pill, vars);
      else gsap.to(pill, { ...vars, duration: 0.5, ease: 'power3.out', overwrite: true });
    };

    links.forEach((link) => {
      link.addEventListener('mouseenter', () => moveTo(link));
      link.addEventListener('focus', () => moveTo(link));
    });
    nav.addEventListener('mouseleave', () => moveTo(active));
    nav.addEventListener('focusout', (e) => { if (!nav.contains(e.relatedTarget)) moveTo(active); });

    const settle = () => moveTo(active, true);
    if (document.fonts?.ready) document.fonts.ready.then(settle); else settle();
    window.addEventListener('resize', settle);
  }

  /* ------------------------------------------------------------------------
     4. Mobile drawer — one owner, real focus management, no bleed-through
     ------------------------------------------------------------------------ */
  if (drawer && burger) {
    const drawerLinks = () => $$('.ajs-drawer__list li > a', drawer);
    const focusables = () => [burger, ...$$('a[href], button:not([disabled])', drawer)];
    let scrollbarComp = 0;
    let tl = null;

    const origin = () => {
      const r = burger.getBoundingClientRect();
      return `${Math.round(r.left + r.width / 2)}px ${Math.round(r.top + r.height / 2)}px`;
    };

    const lockScroll = (lock) => {
      if (lock) {
        scrollbarComp = window.innerWidth - root.clientWidth;
        if (scrollbarComp > 0) document.body.style.paddingRight = `${scrollbarComp}px`;
        root.classList.add('ajs-locked');
      } else {
        root.classList.remove('ajs-locked');
        document.body.style.paddingRight = '';
      }
    };

    const openDrawer = () => {
      if (drawerOpen) return;
      drawerOpen = true;
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close menu');
      drawer.removeAttribute('inert');
      drawer.setAttribute('aria-hidden', 'false');
      lockScroll(true);

      if (motion()) {
        const at = origin();
        tl?.kill();
        drawer.classList.remove('is-open');
        tl = gsap.timeline();
        tl.set(drawer, { visibility: 'visible' })
          .fromTo(drawer, { clipPath: `circle(0% at ${at})` }, { clipPath: `circle(150% at ${at})`, duration: 0.75, ease: 'power3.inOut' })
          .fromTo(drawerLinks(), { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.05, ease: 'power4.out' }, 0.18)
          .fromTo($$('.ajs-drawer__eyebrow, .ajs-drawer__foot > *', drawer), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' }, 0.35)
          .add(() => drawer.classList.add('is-open'));
      } else {
        drawer.classList.add('is-open');
      }
      window.setTimeout(() => (drawerLinks()[0] || drawer).focus({ preventScroll: true }), motion() ? 320 : 0);
    };

    const closeDrawer = ({ restoreFocus = true } = {}) => {
      if (!drawerOpen) return;
      drawerOpen = false;
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('inert', '');

      const finish = () => {
        drawer.classList.remove('is-open');
        drawer.style.visibility = '';
        drawer.style.clipPath = '';
        lockScroll(false);
      };

      if (motion()) {
        const at = origin();
        tl?.kill();
        tl = gsap.timeline({ onComplete: finish });
        tl.to(drawer, { clipPath: `circle(0% at ${at})`, duration: 0.55, ease: 'power3.inOut' });
      } else {
        finish();
      }
      if (restoreFocus) burger.focus({ preventScroll: true });
    };

    drawer.setAttribute('inert', '');
    burger.addEventListener('click', (e) => {
      e.preventDefault();
      if (drawerOpen) closeDrawer(); else openDrawer();
    });

    drawer.addEventListener('click', (e) => {
      if (e.target.closest('a[href]')) closeDrawer({ restoreFocus: false });
    });

    document.addEventListener('keydown', (e) => {
      if (!drawerOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.matchMedia('(min-width: 1121px)').addEventListener?.('change', (e) => {
      if (e.matches) closeDrawer({ restoreFocus: false });
    });
  }

  /* ------------------------------------------------------------------------
     5. Page transitions — curtain out on leave, curtain away on arrival
     ------------------------------------------------------------------------ */
  function isTransitionLink(link, event) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== '_self') return false;
    if (link.hasAttribute('download') || link.dataset.noTransition !== undefined) return false;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (!/^https?:$/.test(url.protocol)) return false;
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return false;
    const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
    if (samePage) return false; // in-page anchors scroll natively
    return /(\.html?|\/[^./]*)$/.test(url.pathname);
  }

  if (curtain && gsap) {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link || reduceMotion.matches || !isTransitionLink(link, event)) return;
      event.preventDefault();
      const href = link.href;
      try { sessionStorage.setItem(NAV_FLAG, '1'); } catch { /* ignore */ }
      const go = () => { window.location.href = href; };
      const safety = window.setTimeout(go, 900);
      gsap.fromTo(curtain, { yPercent: 100 }, {
        yPercent: 0,
        duration: 0.5,
        ease: 'power3.inOut',
        onComplete: () => { window.clearTimeout(safety); go(); },
      });
    });

    // Returning via the back button restores a frozen page with the curtain
    // still up; drop it immediately.
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) { gsap.set(curtain, { yPercent: 100 }); root.classList.remove('ajs-entering'); }
    });
  }

  const arriving = root.classList.contains('ajs-entering');
  if (arriving && curtain && motion()) {
    gsap.set(curtain, { yPercent: 0 });
    root.classList.remove('ajs-entering');
    gsap.to(curtain, {
      yPercent: -100,
      duration: 0.8,
      delay: 0.05,
      ease: 'power4.inOut',
      onComplete: () => gsap.set(curtain, { yPercent: 100 }),
    });
  } else {
    root.classList.remove('ajs-entering');
  }

  if (header && motion() && !arriving) {
    gsap.from('.ajs-header__bar', { y: -24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
  }

  /* ------------------------------------------------------------------------
     6. Scroll reveals — also picks up cards that pages render later from
        the API (menu, orders), without ever leaving content invisible.
     ------------------------------------------------------------------------ */
  const REVEAL_SELECTOR = [
    '.reveal', '[data-reveal]',
    '.section-head', '.about-figure', '.about-text', '.stat-row > div',
    '.menu-item', '.order-card', '.reserve-card', '.res-card', '.account-card',
    '.comment-card', '.checkout-step-panel', '.gallery-grid > *',
    '.ajs-reels__head', '.ajs-reel',
    '.ajs-footer__inner > *',
  ].join(',');
  const isHome = document.body.dataset.page === 'home';
  const seen = new WeakSet();

  function registerReveals() {
    const fresh = $$(REVEAL_SELECTOR).filter((el) => {
      if (seen.has(el)) return false;
      if (isHome && !el.closest('.ajs-footer, .ajs-reels')) return false; // home.js animates its own sections
      if (el.closest('#quickCartWidget, .modal, [role="dialog"]')) return false;
      seen.add(el);
      el.classList.add('in'); // legacy .reveal is hidden until .in
      return true;
    });
    if (!fresh.length || !motion() || !ScrollTrigger) return;

    ScrollTrigger.batch(fresh, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.from(batch, {
        y: 28,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
      }),
    });
  }

  registerReveals();

  let revealTimer = 0;
  const scheduleReveals = () => {
    window.clearTimeout(revealTimer);
    revealTimer = window.setTimeout(() => {
      registerReveals();
      ScrollTrigger?.refresh();
    }, 160);
  };
  new MutationObserver((records) => {
    if (records.some((r) => r.addedNodes.length)) scheduleReveals();
  }).observe(document.body, { childList: true, subtree: true });

  // Tabs/filters toggle visibility without adding nodes; re-measure after.
  document.addEventListener('click', (e) => {
    if (e.target.closest('button, [role="tab"]')) scheduleReveals();
  });
  window.addEventListener('load', () => ScrollTrigger?.refresh());

  /* ------------------------------------------------------------------------
     7. Small delights
     ------------------------------------------------------------------------ */
  if (motion() && finePointer.matches) {
    $$('.ajs-cta').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.18);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  const footerWord = $('.ajs-footer__word');
  if (footerWord && motion() && ScrollTrigger) {
    gsap.fromTo(footerWord, { yPercent: 45, opacity: 0.2 }, {
      yPercent: 0,
      opacity: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.ajs-footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
    });
  }

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
