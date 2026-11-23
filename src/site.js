/*
 * owusuboateng.me interactions and animations, editorial edition.
 * Built with Motion (https://motion.dev). Source for assets/js/site.js:
 *   npm install && npm run build
 */
import { animate, inView, scroll, stagger, hover, press } from 'motion';
import { initTerminal } from './terminal.js';

window.__siteMotionReady = true;

const root = document.documentElement;
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const MOTION = root.classList.contains('motion-ok') && !reduceQuery.matches;
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const DESKTOP = window.matchMedia('(min-width: 960px)');

const EASE = [0.16, 1, 0.3, 1];
const SPRING = { type: 'spring', stiffness: 380, damping: 32 };
const SOFT_SPRING = { type: 'spring', stiffness: 160, damping: 18 };

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function go(target, keyframes, options = {}) {
    return animate(target, keyframes, MOTION ? options : { duration: 0 });
}

/* ------------------------------------------------------------------ */
/* Always on                                                           */
/* ------------------------------------------------------------------ */

function initNav() {
    const nav = $('[data-nav]');
    const links = $$('.nav__link');
    const linkFor = (id) => links.find((l) => l.getAttribute('href') === '#' + id);

    const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const sectionMap = { top: null, about: 'about', certifications: 'about', experience: 'experience', skills: 'skills', projects: 'projects', contact: 'contact' };
    const setActive = (link) => links.forEach((l) => {
        l.classList.toggle('is-active', l === link);
        if (l === link) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const key = sectionMap[entry.target.id];
            setActive(key ? linkFor(key) : null);
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => observer.observe(s));
}

function initMobileMenu() {
    const menu = $('#mobile-menu');
    const openBtn = $('[data-menu-open]');
    const closeBtn = $('[data-menu-close]');
    if (!menu || !openBtn || !closeBtn) return;
    const items = $$('.mobile-menu__link', menu);
    const extras = $$('.mobile-menu__foot a', menu);

    function open() {
        menu.hidden = false;
        openBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        go(menu, { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] }, { duration: 0.6, ease: EASE });
        go(items, { opacity: [0, 1], y: [40, 0] }, { delay: stagger(0.05, { startDelay: 0.15 }), duration: 0.6, ease: EASE });
        items[0]?.focus();
    }

    function close(returnFocus = true) {
        openBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        const done = () => {
            menu.hidden = true;
            menu.style.clipPath = '';
            if (returnFocus) openBtn.focus();
        };
        if (MOTION) animate(menu, { clipPath: 'inset(0 0 100% 0)' }, { duration: 0.4, ease: EASE }).then(done);
        else done();
    }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', () => close());
    items.forEach((item) => item.addEventListener('click', () => close(false)));

    menu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
        if (e.key !== 'Tab') return;
        const focusables = [closeBtn, ...items, ...extras];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    DESKTOP.addEventListener('change', (e) => {
        if (e.matches && !menu.hidden) close(false);
    });
}

function initCopy() {
    const btn = $('[data-copy]');
    const status = $('[data-copy-status]');
    if (!btn) return;
    const label = $('.copy-btn__label', btn);
    let timer;
    btn.addEventListener('click', async () => {
        let ok = false;
        try {
            await navigator.clipboard.writeText(btn.dataset.copy);
            ok = true;
        } catch (err) {
            ok = false;
        }
        label.textContent = ok ? 'Copied' : 'Copy failed';
        if (status) status.textContent = ok ? 'Email address copied to clipboard.' : 'Could not copy. The address is ' + btn.dataset.copy;
        go(btn, { scale: [1, 1.12, 1] }, { duration: 0.35, ease: EASE });
        clearTimeout(timer);
        timer = setTimeout(() => { label.textContent = 'Copy'; }, 2000);
    });
}

function initYear() {
    const el = $('[data-year]');
    if (el) el.textContent = String(new Date().getFullYear());
}

/* Local time in Lublin, in the masthead. */
function initClock() {
    const el = $('[data-clock]');
    if (!el) return;
    let fmt;
    try {
        fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' });
    } catch (err) {
        return;
    }
    const tick = () => { el.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 30000);
}

/* Size the giant name so its longest line fills the column exactly. */
function initFitName() {
    const el = $('[data-fit]');
    if (!el) return;
    const fit = () => {
        el.style.fontSize = '';
        const lines = $$('[data-line]', el);
        const widest = Math.max(...lines.map((l) => l.getBoundingClientRect().width));
        const avail = el.getBoundingClientRect().width;
        if (!widest || !avail) return;
        const current = parseFloat(getComputedStyle(el).fontSize);
        const size = Math.min(current * (avail / widest) * 0.995, 260);
        el.style.fontSize = `${size}px`;
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    let raf;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(fit);
    });
}

/* Scroll progress bar works with or without motion (it is information, not decoration). */
function initScrollProgress() {
    const bar = $('.scroll-progress');
    if (bar) scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
}

/* ------------------------------------------------------------------ */
/* Motion only                                                         */
/* ------------------------------------------------------------------ */

function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const inners = [];
    words.forEach((word, i) => {
        const outer = document.createElement('span');
        outer.className = 'split-word';
        const inner = document.createElement('span');
        inner.textContent = word;
        inner.style.transform = 'translateY(110%)';
        outer.appendChild(inner);
        el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
        inners.push(inner);
    });
    el.classList.add('is-split');
    return inners;
}

function revealWords(inners, delay = 0, each = 0.045) {
    return animate(inners, { y: ['110%', '0%'] }, { duration: 1, ease: EASE, delay: stagger(each, { startDelay: delay }) });
}

function fadeUp(target, { y = 24, delay = 0, duration = 0.9 } = {}) {
    return animate(target, { opacity: [0, 1], y: [y, 0] }, { duration, delay, ease: EASE });
}

let terminalApi = null;

function initHero() {
    const lines = $$('.hero [data-line]');
    const tagline = $('.hero [data-split]');
    const tagWords = tagline ? splitWords(tagline) : [];
    const [top, lead, actions, terminal] = [$('.hero__top'), $('.hero__lead'), $('.hero__actions'), $('.terminal')];

    fadeUp(top, { y: 10, duration: 0.6 });
    animate(lines, { y: ['105%', '0%'] }, { duration: 1.2, ease: EASE, delay: stagger(0.12, { startDelay: 0.1 }) });
    revealWords(tagWords, 0.55, 0.035);
    animate('[data-rule]', { scaleX: [0, 1] }, { duration: 1.4, ease: EASE, delay: 0.7 });
    fadeUp(lead, { delay: 0.9 });
    fadeUp(actions, { delay: 1 });
    animate(terminal, { opacity: [0, 1], y: [40, 0], rotate: [2, 0] }, { duration: 1.1, delay: 0.95, ease: EASE })
        .then(() => typeTerminal())
        .then(() => { if (terminalApi) terminalApi.activate(); });

    // Name drifts and the tagline slides a touch as the hero scrolls away.
    const hero = $('.hero');
    scroll(animate('.hero__name', { y: [0, -60] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
}

async function typeTerminal() {
    const lines = $$('[data-terminal] .t-line');
    for (const line of lines) {
        const prompt = $('.t-prompt', line);
        const cursor = $('.t-cursor', line);
        if (prompt && !cursor) {
            const textNode = Array.from(line.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
            const full = textNode ? textNode.textContent : '';
            if (textNode) textNode.textContent = ' ';
            line.style.visibility = 'visible';
            await new Promise((r) => setTimeout(r, 220));
            await animate(0, full.length, {
                duration: Math.max(0.3, full.length * 0.04),
                ease: 'linear',
                onUpdate: (v) => { if (textNode) textNode.textContent = full.slice(0, Math.round(v)); },
            });
        } else {
            line.style.visibility = 'visible';
            await animate(line, { opacity: [0, 1], x: [-6, 0] }, { duration: 0.3, ease: EASE });
        }
    }
}

function initReveals() {
    inView('[data-reveal]', (el) => { fadeUp(el, { y: 36 }); }, { amount: 0.15 });

    inView('[data-stagger]', (el) => {
        animate(Array.from(el.children), { opacity: [0, 1], y: [36, 0] }, { delay: stagger(0.08), duration: 0.9, ease: EASE });
    }, { amount: 0.1 });

    inView('[data-chips]', (group) => {
        fadeUp($('.eyebrow', group), { y: 10, duration: 0.5 });
        animate($$('.chip', group), { opacity: [0, 1], y: [14, 0], rotate: [-3, 0] }, { delay: stagger(0.035, { startDelay: 0.1 }), type: 'spring', stiffness: 380, damping: 24 });
    }, { amount: 0.3 });

    $$('[data-split]').forEach((el) => {
        if (el.closest('.hero')) return;
        const words = splitWords(el);
        inView(el, () => { revealWords(words, 0, 0.09); }, { amount: 0.4 });
    });

}

/* Experience: pin the section on desktop and move the track sideways as the page scrolls. */
function initExperience() {
    const section = $('#experience');
    const exp = $('[data-exp]');
    const track = $('[data-exp-track]');
    if (!section || !exp || !track) return;

    let stop = null;
    function setup() {
        if (stop) { stop(); stop = null; }
        exp.classList.remove('exp--pinned');
        section.classList.remove('is-pinned');
        exp.style.height = '';
        track.style.transform = '';
        if (!DESKTOP.matches) return;

        exp.classList.add('exp--pinned');
        section.classList.add('is-pinned');
        const distance = track.scrollWidth - window.innerWidth;
        if (distance <= 0) {
            exp.classList.remove('exp--pinned');
            section.classList.remove('is-pinned');
            return;
        }
        // Only pin when every card fits the screen height; otherwise keep the swipeable row.
        const sticky = track.parentElement;
        if (track.offsetHeight > sticky.clientHeight - 24) {
            exp.classList.remove('exp--pinned');
            section.classList.remove('is-pinned');
            return;
        }
        exp.style.height = `calc(100vh - var(--bar) + ${distance}px)`;
        stop = scroll(animate(track, { x: [0, -distance] }, { ease: 'linear' }), { target: exp, offset: ['start 64px', 'end end'] });
    }

    setup();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup);
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(setup, 150); });

    inView(track, () => {
        animate($$('.role', track), { opacity: [0, 1], x: [80, 0] }, { delay: stagger(0.1), duration: 1, ease: EASE });
    }, { amount: 0.2 });
}

function initWork() {
    // Big project titles slide in from the side.
    inView('.project h3', (h) => {
        animate(h, { x: ['-6%', '0%'], opacity: [0, 1] }, { duration: 1.1, ease: EASE });
    }, { amount: 0.4 });
}

function initCursor() {
    const dot = $('[data-cursor]');
    if (!dot) return;
    let shown = false;
    window.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (!shown) { shown = true; animate(dot, { opacity: 1 }, { duration: 0.3 }); }
        animate(dot, { x: e.clientX, y: e.clientY }, { type: 'spring', stiffness: 700, damping: 45, mass: 0.4 });
    }, { passive: true });
    document.addEventListener('pointerleave', () => { shown = false; animate(dot, { opacity: 0 }, { duration: 0.2 }); });
    hover('a, button, .cert, .chip', () => {
        animate(dot, { scale: 3.2 }, SPRING);
        return () => animate(dot, { scale: 1 }, SPRING);
    });
}

function initMagnetic() {
    hover('[data-magnetic]', (btn) => {
        const onMove = (e) => {
            const r = btn.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            animate(btn, { x: dx * 0.2, y: dy * 0.28 }, { type: 'spring', stiffness: 300, damping: 20 });
        };
        btn.addEventListener('pointermove', onMove);
        return () => {
            btn.removeEventListener('pointermove', onMove);
            animate(btn, { x: 0, y: 0 }, SOFT_SPRING);
        };
    });
}

function initPress() {
    press('.btn, .copy-btn, .menu-btn, .terminal__chiprow button', (el) => {
        animate(el, { scale: 0.95 }, { duration: 0.12 });
        return () => animate(el, { scale: 1 }, { type: 'spring', stiffness: 520, damping: 24 });
    });
}

/* ------------------------------------------------------------------ */

function start() {
    terminalApi = initTerminal({ motion: MOTION });
    initNav();
    initMobileMenu();
    initCopy();
    initYear();
    initClock();
    initFitName();
    initScrollProgress();

    if (!MOTION) {
        if (terminalApi) terminalApi.activate();
        return;
    }
    initHero();
    initReveals();
    initExperience();
    initWork();
    initPress();
    if (FINE_POINTER) {
        initCursor();
        initMagnetic();
    }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
