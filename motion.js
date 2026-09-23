(() => {
  'use strict';

  const fallback = {
    animateQuestion() {},
    initResult() {},
    refresh() {}
  };

  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.add('motion-fallback');
    window.LumeMotion = fallback;
    return;
  }

  const { gsap, ScrollTrigger } = window;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clearMotionProps = 'transform,opacity,visibility,clipPath,willChange';
  let resultMedia;
  let resultInitialized = false;
  let questionTimeline;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ overwrite: 'auto' });
  ScrollTrigger.config({ limitCallbacks: true });
  document.documentElement.classList.add('motion-ready');

  function titleReveal(timeline, target, options = {}) {
    if (!target) return timeline;
    const {
      at,
      duration = .82,
      ease = 'power4.out',
      x = 0,
      y = 48,
      clipFrom = 'inset(0 0 100% 0)'
    } = options;
    timeline.fromTo(target, {
      autoAlpha: 0,
      x,
      y,
      clipPath: clipFrom,
      willChange: 'transform, opacity, clip-path'
    }, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      clipPath: 'inset(0 0 0% 0)',
      duration,
      ease,
      clearProps: clearMotionProps
    }, at);
    return timeline;
  }

  function createSectionTimeline(trigger, start = 'top 78%') {
    return gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger, start, once: true }
    });
  }

  function batchReveal(targets, { mobile, x = 0, y = 26, batchMax = 3 } = {}) {
    if (!targets.length) return;
    ScrollTrigger.batch(targets, {
      start: 'top 91%',
      once: true,
      interval: .12,
      batchMax: mobile ? 2 : batchMax,
      onEnter(batch) {
        gsap.fromTo(batch, {
          autoAlpha: 0,
          x: mobile ? 0 : x,
          y: mobile ? Math.min(y, 18) : y,
          clipPath: 'inset(0 0 8% 0)',
          willChange: 'transform, opacity, clip-path'
        }, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          clipPath: 'inset(0 0 0% 0)',
          duration: mobile ? .48 : .66,
          stagger: mobile ? .05 : .075,
          ease: 'power3.out',
          clearProps: clearMotionProps
        });
      }
    });
  }

  function ensureSheen(button) {
    let sheen = $('.motion-sheen', button);
    if (sheen) return sheen;
    sheen = document.createElement('span');
    sheen.className = 'motion-sheen';
    sheen.setAttribute('aria-hidden', 'true');
    button.appendChild(sheen);
    return sheen;
  }

  function createButtonAttention(button, trigger, { mobile = false, emphasis = 1 } = {}) {
    if (!button || !trigger) return () => {};
    const sheen = ensureSheen(button);
    const scale = mobile ? 1.008 : 1 + (.012 * emphasis);
    const halo = mobile ? 3 : 5;
    const sheenOpacity = mobile ? .28 : .48;
    const timeline = gsap.timeline({ paused: true, repeat: -1, repeatDelay: .35 });

    timeline
      .to(button, {
        scale,
        boxShadow: `0 0 0 ${halo}px rgba(255, 229, 0, .09)`,
        duration: .2,
        ease: 'power2.out'
      }, 4)
      .fromTo(sheen, {
        autoAlpha: 0,
        xPercent: -180,
        skewX: -16
      }, {
        autoAlpha: sheenOpacity,
        xPercent: 520,
        skewX: -16,
        duration: .82,
        ease: 'power2.inOut'
      }, 4)
      .to(button, {
        scale: 1,
        boxShadow: '0 0 0 0 rgba(255, 229, 0, 0)',
        duration: .42,
        ease: 'power3.out'
      }, 4.2)
      .to(sheen, { autoAlpha: 0, duration: .12 }, 4.7)
      .set(button, { clearProps: 'transform,boxShadow' });

    const viewportTrigger = ScrollTrigger.create({
      trigger,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => timeline.play(0),
      onEnterBack: () => timeline.play(),
      onLeave: () => timeline.pause(0),
      onLeaveBack: () => timeline.pause(0)
    });

    const pauseForPointer = () => {
      timeline.pause();
      gsap.set(button, { clearProps: 'transform,boxShadow' });
      gsap.set(sheen, { autoAlpha: 0 });
    };
    const resumeForPointer = () => {
      if (viewportTrigger.isActive) timeline.play();
    };
    button.addEventListener('pointerenter', pauseForPointer);
    button.addEventListener('pointerleave', resumeForPointer);

    return () => {
      button.removeEventListener('pointerenter', pauseForPointer);
      button.removeEventListener('pointerleave', resumeForPointer);
      timeline.kill();
      viewportTrigger.kill();
      gsap.set(button, { clearProps: 'transform,boxShadow' });
    };
  }

  function setupHeader() {
    const header = $('.site-header');
    if (!header) return;
    const updateState = () => header.classList.toggle('is-scrolled', window.scrollY > 72);
    updateState();
    ScrollTrigger.create({
      start: 72,
      end: () => ScrollTrigger.maxScroll(window) + window.innerHeight,
      onToggle: updateState,
      onRefresh: updateState
    });
  }

  function setupHero({ mobile }) {
    const hero = $('.hero');
    if (!hero) return;
    const header = $('.header-inner');
    const eyebrow = $('.eyebrow', hero);
    const titleBlocks = $$('h1 > span, h1 > em', hero);
    const highlight = $('h1 > em', hero);
    const amount = $('.hero-amount-inline', hero);
    const bottom = $('.hero-bottom', hero);
    const lede = $('.hero-lede', hero);
    const actions = $('.hero-actions', hero);
    const disclosure = $('.hero-disclosure', hero);

    if (window.scrollY < 120) {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .fromTo(header, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: .52, clearProps: clearMotionProps }, 0)
        .fromTo(eyebrow, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: .5, clearProps: clearMotionProps }, .08)
        .fromTo(titleBlocks, {
          autoAlpha: 0,
          yPercent: mobile ? 58 : 82,
          clipPath: 'inset(0 0 100% 0)',
          willChange: 'transform, opacity, clip-path'
        }, {
          autoAlpha: 1,
          yPercent: 0,
          clipPath: 'inset(0 0 0% 0)',
          duration: mobile ? .68 : .88,
          stagger: mobile ? .09 : .13,
          ease: 'power4.out',
          clearProps: clearMotionProps
        }, .14)
        .fromTo(amount, { autoAlpha: .3, y: 8, scale: .98 }, { autoAlpha: 1, y: 0, scale: 1, duration: .5, clearProps: clearMotionProps }, .48)
        .fromTo(highlight, { '--hero-rule-scale': 0 }, { '--hero-rule-scale': 1, duration: .72, ease: 'power3.out', clearProps: '--hero-rule-scale' }, .58)
        .fromTo(bottom, { '--hero-divider-scale': 0 }, { '--hero-divider-scale': 1, duration: .78, ease: 'power3.out', clearProps: '--hero-divider-scale' }, .64)
        .fromTo(lede, { autoAlpha: 0, y: mobile ? 12 : 18 }, { autoAlpha: 1, y: 0, duration: .62, clearProps: clearMotionProps }, .74)
        .fromTo(actions, { autoAlpha: 0, y: mobile ? 10 : 16 }, { autoAlpha: 1, y: 0, duration: .56, clearProps: clearMotionProps }, .9)
        .fromTo(disclosure, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .52, clearProps: clearMotionProps }, 1.02);
    }

    return createButtonAttention($('.hero-actions .button', hero), hero, { mobile });
  }

  function setupLandingSections({ mobile }) {
    const cleanups = [];
    const quizSection = $('.inline-quiz');
    if (quizSection) {
      const heading = $('.funnel-heading', quizSection);
      const timeline = createSectionTimeline(quizSection, 'top 76%');
      timeline
        .fromTo($('.eyebrow', heading), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: .48, clearProps: clearMotionProps })
        .add(() => {}, 'quizTitle');
      titleReveal(timeline, $('h2', heading), { at: 'quizTitle-=.2', y: mobile ? 28 : 44 });
      timeline
        .fromTo($(':scope > p', heading), { autoAlpha: 0, x: mobile ? 0 : 24, y: mobile ? 12 : 0 }, { autoAlpha: 1, x: 0, y: 0, duration: .58, clearProps: clearMotionProps }, 'quizTitle+=.02')
        .fromTo($('.quiz-card', quizSection), { autoAlpha: 0, y: mobile ? 16 : 24 }, { autoAlpha: 1, y: 0, duration: .66, clearProps: clearMotionProps }, 'quizTitle+=.18');
    }

    const testimonials = $('.testimonials:not([hidden])');
    if (testimonials) {
      const timeline = createSectionTimeline(testimonials, 'top 80%');
      timeline.fromTo($('.eyebrow', testimonials), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: .45, clearProps: clearMotionProps });
      titleReveal(timeline, $('h2', testimonials), { at: '-=.24', y: mobile ? 30 : 48 });
      batchReveal($$('.feedback-card', testimonials), { mobile, y: 24, batchMax: 3 });
    }

    const process = $('.process');
    if (process) {
      const timeline = createSectionTimeline(process);
      timeline.fromTo($('.eyebrow', process), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: .45, clearProps: clearMotionProps });
      titleReveal(timeline, $('h2', process), { at: '-=.22', y: mobile ? 28 : 44 });
      timeline
        .fromTo($('.section-intro', process), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .55, clearProps: clearMotionProps }, '-=.36')
        .fromTo($$('.steps article', process), {
          autoAlpha: 0,
          y: mobile ? 16 : 24,
          clipPath: 'inset(0 0 12% 0)'
        }, {
          autoAlpha: 1,
          y: 0,
          clipPath: 'inset(0 0 0% 0)',
          duration: mobile ? .46 : .62,
          stagger: mobile ? .06 : .11,
          clearProps: clearMotionProps
        }, '-=.18');
    }

    const benefits = $('.benefits');
    if (benefits) {
      const timeline = createSectionTimeline(benefits);
      timeline.fromTo($('.eyebrow', benefits), { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: .45, clearProps: clearMotionProps });
      titleReveal(timeline, $('h2', benefits), {
        at: '-=.2',
        x: mobile ? 0 : -28,
        y: mobile ? 26 : 0,
        clipFrom: mobile ? 'inset(0 0 100% 0)' : 'inset(0 100% 0 0)'
      });
      batchReveal($$('.benefit-list article', benefits), { mobile, x: 22, y: 12, batchMax: 2 });
    }

    const instagram = $('.instagram');
    if (instagram) {
      const timeline = createSectionTimeline(instagram, 'top 74%');
      const titleLines = $$('.motion-title-line', instagram);
      timeline
        .fromTo($('.eyebrow', instagram), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: .46, clearProps: clearMotionProps })
        .fromTo(titleLines, {
          autoAlpha: 0,
          yPercent: mobile ? 58 : 78,
          clipPath: 'inset(0 0 100% 0)'
        }, {
          autoAlpha: 1,
          yPercent: 0,
          clipPath: 'inset(0 0 0% 0)',
          duration: mobile ? .62 : .78,
          stagger: .09,
          ease: 'power4.out',
          clearProps: clearMotionProps
        }, '-=.2')
        .fromTo($('.instagram-copy > p:last-child', instagram), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .56, clearProps: clearMotionProps }, '-=.34')
        .fromTo($('.instagram-action', instagram), { autoAlpha: 0, x: mobile ? 0 : 34, y: mobile ? 18 : 0 }, { autoAlpha: 1, x: 0, y: 0, duration: .72, clearProps: clearMotionProps }, '-=.38');
    }

    const faq = $('.faq');
    if (faq) {
      const timeline = createSectionTimeline(faq);
      timeline.fromTo($('.eyebrow', faq), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: .44, clearProps: clearMotionProps });
      titleReveal(timeline, $('h2', faq), { at: '-=.22', x: mobile ? 0 : -24, y: mobile ? 28 : 0, clipFrom: mobile ? 'inset(0 0 100% 0)' : 'inset(0 100% 0 0)' });
      batchReveal($$('.faq-item', faq), { mobile, y: 12, batchMax: 3 });
    }

    const finalCta = $('.final-cta');
    if (finalCta) {
      const timeline = createSectionTimeline(finalCta, 'top 82%');
      timeline.fromTo($('.eyebrow', finalCta), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: .44, clearProps: clearMotionProps });
      titleReveal(timeline, $('h2', finalCta), { at: '-=.2', duration: mobile ? .68 : .92, y: mobile ? 32 : 52 });
      timeline.fromTo($$('.final-cta p:not(.eyebrow), .final-cta .button, .final-cta small'), {
        autoAlpha: 0,
        y: mobile ? 12 : 18
      }, {
        autoAlpha: 1,
        y: 0,
        duration: mobile ? .46 : .58,
        stagger: mobile ? .06 : .1,
        clearProps: clearMotionProps
      }, '-=.38');
      cleanups.push(createButtonAttention($('.button', finalCta), finalCta, { mobile, emphasis: 1.25 }));
    }
    return cleanups;
  }

  function setupMainMotion() {
    const media = gsap.matchMedia();
    media.add({
      desktop: '(min-width: 921px)',
      mobile: '(max-width: 920px)',
      reduce: '(prefers-reduced-motion: reduce)'
    }, context => {
      const { mobile, reduce } = context.conditions;
      if (reduce) {
        document.documentElement.classList.add('motion-reduced');
        return;
      }
      const cleanups = [];
      document.documentElement.classList.remove('motion-reduced');
      setupHeader();
      cleanups.push(setupHero({ mobile }));
      cleanups.push(...setupLandingSections({ mobile }));
      return () => {
        cleanups.filter(Boolean).forEach(cleanup => cleanup());
        $('.site-header')?.classList.remove('is-scrolled');
      };
    });
  }

  function animateQuestion(panel) {
    if (!panel || reducedMotion.matches) return;
    questionTimeline?.kill();
    const mobile = window.matchMedia('(max-width: 680px)').matches;
    const title = $('h2', panel);
    const options = $$('.quiz-option', panel);
    const formParts = $$('.instagram-form > *', panel);
    questionTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    questionTimeline.fromTo(title, {
      autoAlpha: 0,
      x: mobile ? -8 : -16,
      clipPath: 'inset(0 100% 0 0)'
    }, {
      autoAlpha: 1,
      x: 0,
      clipPath: 'inset(0 0% 0 0)',
      duration: mobile ? .42 : .55,
      clearProps: clearMotionProps
    });
    const controls = options.length ? options : formParts;
    questionTimeline.fromTo(controls, {
      autoAlpha: 0,
      x: mobile ? 8 : 14
    }, {
      autoAlpha: 1,
      x: 0,
      duration: mobile ? .34 : .42,
      stagger: mobile ? .035 : .05,
      clearProps: clearMotionProps
    }, '-=.22');
  }

  function setupResultMotion({ mobile }) {
    const cleanups = [];
    const approved = $('.approved-hero');
    if (approved) {
      const timeline = createSectionTimeline(approved, 'top 72%');
      timeline
        .fromTo($('.approved-kicker', approved), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .45, clearProps: clearMotionProps });
      titleReveal(timeline, $('h2', approved), { at: '-=.2', y: mobile ? 30 : 44 });
      timeline
        .fromTo($('.approved-amount', approved), {
          autoAlpha: 0,
          y: mobile ? 24 : 38,
          scale: .965,
          '--approved-rule-scale': 0
        }, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          '--approved-rule-scale': 1,
          duration: mobile ? .7 : .95,
          ease: 'power4.out',
          clearProps: `${clearMotionProps},--approved-rule-scale`
        }, '-=.38')
        .fromTo($('h3', approved), { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: .52, clearProps: clearMotionProps }, '-=.4')
        .fromTo($$('.approved-condition, .approved-next-step, .button', approved), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .5, stagger: .08, clearProps: clearMotionProps }, '-=.25');
      cleanups.push(createButtonAttention($('.button', approved), approved, { mobile, emphasis: 1.08 }));
    }

    const vsl = $('.vsl-section');
    if (vsl) {
      const timeline = createSectionTimeline(vsl, 'top 75%');
      timeline.fromTo($('.eyebrow', vsl), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: .45, clearProps: clearMotionProps });
      titleReveal(timeline, $('h2', vsl), { at: '-=.22', y: mobile ? 30 : 46 });
      timeline
        .fromTo($('.vsl-shell > p:not(.eyebrow)', vsl), { autoAlpha: 0, y: 13 }, { autoAlpha: 1, y: 0, duration: .55, clearProps: clearMotionProps }, '-=.34')
        .fromTo($('.video-frame', vsl), {
          autoAlpha: 0,
          clipPath: mobile ? 'inset(4% 0 4% 0 round 8px)' : 'inset(7% 3% 7% 3% round 10px)',
          y: mobile ? 14 : 24
        }, {
          autoAlpha: 1,
          clipPath: 'inset(0% 0% 0% 0% round 8px)',
          y: 0,
          duration: mobile ? .62 : .9,
          ease: 'power3.out',
          clearProps: clearMotionProps
        }, '-=.18')
        .fromTo($('.video-placeholder', vsl), { scale: mobile ? 1.01 : 1.025 }, { scale: 1, duration: .9, ease: 'power2.out', clearProps: 'transform' }, '<');
    }

    $$('.campaign-moment').forEach((moment, index) => {
      const timeline = createSectionTimeline(moment, 'top 76%');
      timeline
        .fromTo($('.moment-number', moment), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .42, clearProps: clearMotionProps });
      titleReveal(timeline, $('strong', moment), {
        at: '-=.18',
        x: mobile ? 0 : (index % 2 ? 28 : -28),
        y: mobile ? 30 : 0,
        clipFrom: mobile ? 'inset(0 0 100% 0)' : (index % 2 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)')
      });
      timeline.fromTo($$('p, .button', moment), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .5, stagger: .08, clearProps: clearMotionProps }, '-=.32');
    });
    return () => cleanups.filter(Boolean).forEach(cleanup => cleanup());
  }

  function initResult() {
    if (resultInitialized || $('#resultado')?.hidden) return;
    resultInitialized = true;
    if (reducedMotion.matches) {
      ScrollTrigger.refresh();
      return;
    }
    resultMedia = gsap.matchMedia();
    resultMedia.add({
      desktop: '(min-width: 921px)',
      mobile: '(max-width: 920px)',
      reduce: '(prefers-reduced-motion: reduce)'
    }, context => {
      if (!context.conditions.reduce) return setupResultMotion({ mobile: context.conditions.mobile });
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  function refresh() {
    if (!reducedMotion.matches) ScrollTrigger.refresh();
  }

  setupMainMotion();
  animateQuestion($('.question-panel'));
  if (!$('#resultado')?.hidden) initResult();

  window.addEventListener('load', refresh, { once: true });
  document.fonts?.ready?.then(refresh);
  window.LumeMotion = { animateQuestion, initResult, refresh };
})();
