/* ==========================================================================
   A&J'S FOODFLIX — KINETIC GSAP ENGINE & INTERACTIONS
   Smooth, High-Performance, Monochromatic Orchestration
   ========================================================================== */

(function () {
  'use strict';

  // Ensure GSAP is loaded
  if (typeof gsap === 'undefined') {
    console.warn('GSAP is not loaded. Skipping animations.');
    return;
  }

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* --------------------------------------------------------------------------
     1. Ambient Mouse Spotlight (Fine pointers only)
     -------------------------------------------------------------------------- */
  const spotlight = document.getElementById('mouseSpotlight');
  if (spotlight && isFinePointer && !isReducedMotion) {
    const xTo = gsap.quickTo(spotlight, 'left', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(spotlight, 'top', { duration: 0.45, ease: 'power3.out' });

    window.addEventListener('pointermove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });
  }

  /* --------------------------------------------------------------------------
     2. Header Scroll Blur Effect & Mobile Navigation
     -------------------------------------------------------------------------- */
  const header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  const mobileToggle = document.getElementById('mobileNavToggle');
  const mobileMenu = document.getElementById('mobileMenuOverlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');

  function toggleMobileMenu(open) {
    if (!mobileMenu || !mobileToggle) return;
    const isOpen = open !== undefined ? open : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', isOpen);
    mobileToggle.classList.toggle('open', isOpen);
    mobileToggle.setAttribute('aria-expanded', isOpen);
    mobileToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen && typeof gsap !== 'undefined') {
      gsap.fromTo('.mobile-nav-links li', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
      );
    }
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => toggleMobileMenu());
  }

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMobileMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1150) toggleMobileMenu(false);
  });

  /* --------------------------------------------------------------------------
     3. Hero Entrance Timeline
     -------------------------------------------------------------------------- */
  if (!isReducedMotion) {
    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    heroTl
      .from('.hero-badge-wrap', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.1
      })
      .from('.hero-title .title-line span', {
        yPercent: 110,
        duration: 1.1,
        stagger: 0.12,
        ease: 'power4.out'
      }, '-=0.5')
      .from('.hero-description', {
        y: 24,
        opacity: 0,
        duration: 0.9
      }, '-=0.7')
      .from('.hero-actions > *', {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08
      }, '-=0.6')
      .from('.metric-item', {
        y: 16,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1
      }, '-=0.5')
      .from('.hero-stage', {
        scale: 0.92,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out'
      }, '-=1.1')
      .from('.floating-glass-pill', {
        scale: 0.8,
        opacity: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.5)'
      }, '-=0.6');
  }

  /* --------------------------------------------------------------------------
     4. Magnetic Buttons (Fine pointers only)
     -------------------------------------------------------------------------- */
  if (isFinePointer && !isReducedMotion) {
    const magneticElements = document.querySelectorAll('.magnet-btn');

    magneticElements.forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });

      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        xTo(relX * 0.28);
        yTo(relY * 0.28);
      });

      el.addEventListener('pointerleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. 3D Card Hover Perspective Tilt
     -------------------------------------------------------------------------- */
  if (isFinePointer && !isReducedMotion) {
    const tiltCards = document.querySelectorAll('.tilt-3d');

    tiltCards.forEach((card) => {
      const rotXTo = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power2.out' });
      const rotYTo = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power2.out' });

      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotYTo(px * 12);
        rotXTo(-py * 12);
      });

      card.addEventListener('pointerleave', () => {
        rotXTo(0);
        rotYTo(0);
      });
    });
  }

  /* --------------------------------------------------------------------------
     6. Kinetic Marquee (Scroll-reactive)
     -------------------------------------------------------------------------- */
  const marqueeTrack = document.getElementById('marqueeTrack');
  if (marqueeTrack && !isReducedMotion) {
    // Duplicate inner content for infinite seamless loop
    marqueeTrack.innerHTML += marqueeTrack.innerHTML + marqueeTrack.innerHTML;

    const marqueeLoop = gsap.to(marqueeTrack, {
      xPercent: -33.333,
      ease: 'none',
      duration: 25,
      repeat: -1
    });

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        onUpdate: (self) => {
          const velocity = Math.abs(self.getVelocity());
          const speedMultiplier = Math.min(4, 1 + velocity / 600);
          gsap.to(marqueeLoop, {
            timeScale: self.direction * speedMultiplier,
            duration: 0.25,
            overwrite: true
          });
          gsap.to(marqueeLoop, {
            timeScale: self.direction,
            delay: 0.4,
            duration: 1
          });
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     7. ScrollTrigger Section & Card Reveals
     -------------------------------------------------------------------------- */
  if (typeof ScrollTrigger !== 'undefined' && !isReducedMotion) {
    // Reveal section headers
    gsap.utils.toArray('.reveal-head').forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        },
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out'
      });
    });

    // Reveal product cards in batch
    ScrollTrigger.batch('.product-card', {
      start: 'top 86%',
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 50,
          opacity: 0,
          stagger: 0.1,
          duration: 0.85,
          ease: 'power3.out'
        });
      }
    });

    // Experience step cards
    ScrollTrigger.batch('.step-card', {
      start: 'top 86%',
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 40,
          opacity: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out'
        });
      }
    });

    // Testimonials
    ScrollTrigger.batch('.test-card', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 40,
          opacity: 0,
          stagger: 0.12,
          duration: 0.85,
          ease: 'power3.out'
        });
      }
    });
  }

  /* --------------------------------------------------------------------------
     8. Category Filter for Curated Dishes
     -------------------------------------------------------------------------- */
  const categoryTabs = document.querySelectorAll('.cat-tab-btn');
  const productCards = document.querySelectorAll('.product-card');

  categoryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;

      productCards.forEach((card) => {
        const category = card.dataset.category;
        const matches = filter === 'all' || category === filter;

        if (matches) {
          gsap.to(card, {
            display: 'flex',
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
          });
        } else {
          gsap.to(card, {
            opacity: 0,
            scale: 0.95,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
              card.style.display = 'none';
            }
          });
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
     9. Ambient Hero Video Control
     -------------------------------------------------------------------------- */
  const videoToggleBtn = document.getElementById('heroVideoToggle');
  const heroVideo = document.getElementById('heroVideo');

  if (videoToggleBtn && heroVideo) {
    videoToggleBtn.addEventListener('click', () => {
      if (heroVideo.paused) {
        heroVideo.play();
        videoToggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          PAUSE REEL
        `;
      } else {
        heroVideo.pause();
        videoToggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          PLAY REEL
        `;
      }
    });
  }

  /* --------------------------------------------------------------------------
     10. Location Address Copy & Toast
     -------------------------------------------------------------------------- */
  const copyAddressBtn = document.getElementById('copyAddressBtn');
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener('click', async () => {
      const addressText = '2nd Floor, DKB Building, Poblacion, Baggao, Cagayan';
      try {
        await navigator.clipboard.writeText(addressText);
        const originalText = copyAddressBtn.innerHTML;
        copyAddressBtn.innerHTML = '<span>✓ Copied to clipboard</span>';
        setTimeout(() => {
          copyAddressBtn.innerHTML = originalText;
        }, 2200);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    });
  }

  /* --------------------------------------------------------------------------
     11. Back to Top Button with Smooth Scroll
     -------------------------------------------------------------------------- */
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Set dynamic copyright year
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Refresh ScrollTrigger when images load
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });
})();
