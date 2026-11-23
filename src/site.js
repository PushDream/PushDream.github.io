/*
 * owusuboateng.me interactions and animations.
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

const EASE = [0.16, 1, 0.3, 1];
const SPRING = { type: 'spring', stiffness: 380, damping: 32 };
const SOFT_SPRING = { type: 'spring', stiffness: 160, damping: 18 };

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* Animate when motion is allowed, otherwise jump straight to the end state. */
function go(target, keyframes, options = {}) {
    return animate(target, keyframes, MOTION ? options : { duration: 0 });
}

/* ------------------------------------------------------------------ */
/* Always on: navigation, menu, copy button                            */
/* ------------------------------------------------------------------ */

function initNav() {
    const nav = $('[data-nav]');
    const links = $$('.nav__link');
    const pill = $('.nav__pill');
    const linkFor = (id) => links.find((l) => l.getAttribute('href') === '#' + id);
    let active = null;

    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function movePill(link) {
        if (!pill) return;
        if (!link) {
            go(pill, { opacity: 0 }, { duration: 0.2 });
            return;
        }
        go(pill, { x: link.offsetLeft, width: link.offsetWidth, opacity: 1 }, SPRING);
    }

    function setActive(link) {
        active = link;
        links.forEach((l) => {
            l.classList.toggle('is-active', l === link);
            if (l === link) l.setAttribute('aria-current', 'true');
            else l.removeAttribute('aria-current');
        });
        movePill(link);
    }

    // Section that crosses the middle of the viewport is the active one.
    const sectionMap = { top: null, about: 'about', certifications: 'about', experience: 'experience', skills: 'skills', projects: 'projects', contact: 'contact' };
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const key = sectionMap[entry.target.id];
                setActive(key ? linkFor(key) : null);
            });
        },
        { rootMargin: '-45% 0px -50% 0px' }
    );
    $$('main section[id]').forEach((s) => observer.observe(s));

    // Pill follows the pointer across links, then returns to the active one.
    if (FINE_POINTER) {
        links.forEach((link) => {
            link.addEventListener('pointerenter', () => movePill(link));
        });
        $('.nav__links')?.addEventListener('pointerleave', () => movePill(active));
    }

    window.addEventListener('resize', () => movePill(active));
}

function initMobileMenu() {
    const menu = $('#mobile-menu');
    const openBtn = $('[data-menu-open]');
    const closeBtn = $('[data-menu-close]');
    if (!menu || !openBtn) return;
    const items = $$('.mobile-menu__link', menu);

    function open() {
        menu.hidden = false;
        openBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        go(menu, { opacity: [0, 1] }, { duration: 0.25 });
        go(items, { opacity: [0, 1], y: [28, 0] }, { delay: stagger(0.05, { startDelay: 0.06 }), duration: 0.5, ease: EASE });
        items[0]?.focus();
    }

    function close(returnFocus = true) {
        openBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        const done = () => {
            menu.hidden = true;
            if (returnFocus) openBtn.focus();
        };
        if (MOTION) animate(menu, { opacity: 0 }, { duration: 0.2 }).then(done);
        else done();
    }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', () => close());
    items.forEach((item) => item.addEventListener('click', () => close(false)));

    menu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
        if (e.key !== 'Tab') return;
        const focusables = [closeBtn, ...items];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
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

/* ------------------------------------------------------------------ */
/* Motion only                                                         */
/* ------------------------------------------------------------------ */

/* Wrap each word in a clipping mask so it can slide up into view. */
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
    return animate(inners, { y: ['110%', '0%'] }, { duration: 0.9, ease: EASE, delay: stagger(each, { startDelay: delay }) });
}

function fadeUp(target, { y = 20, delay = 0, duration = 0.8 } = {}) {
    return animate(target, { opacity: [0, 1], y: [y, 0] }, { duration, delay, ease: EASE });
}

function initHero() {
    const [nameEl, taglineEl] = $$('.hero [data-split]');
    const nameWords = splitWords(nameEl);
    const taglineWords = splitWords(taglineEl);
    const [chip, lead, actions, terminal, proof] = [
        $('.hero .status-chip'), $('.hero__lead'), $('.hero__actions'), $('.terminal'), $('.proof'),
    ];

    fadeUp(chip, { y: 12, duration: 0.6 });
    revealWords(nameWords, 0.1, 0.07);
    revealWords(taglineWords, 0.35, 0.025);
    fadeUp(lead, { delay: 0.6 });
    fadeUp(actions, { delay: 0.72 });
    animate(terminal, { opacity: [0, 1], y: [32, 0], scale: [0.97, 1] }, { duration: 1, delay: 0.5, ease: EASE })
        .then(() => typeTerminal())
        .then(() => { if (terminalApi) terminalApi.activate(); });

    inView(proof, () => {
        fadeUp(proof, { y: 12, duration: 0.6 });
        animate($$('.proof__list li'), { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.07, { startDelay: 0.15 }), duration: 0.6, ease: EASE });
    }, { amount: 0.3 });
}

/* Type each command, then print its output. */
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
            await new Promise((r) => setTimeout(r, 260));
            await animate(0, full.length, {
                duration: Math.max(0.35, full.length * 0.045),
                ease: 'linear',
                onUpdate: (v) => { if (textNode) textNode.textContent = full.slice(0, Math.round(v)); },
            });
        } else {
            line.style.visibility = 'visible';
            await animate(line, { opacity: [0, 1], x: [-6, 0] }, { duration: 0.35, ease: EASE });
        }
    }
}

function initReveals() {
    inView('[data-reveal]:not(.role)', (el) => {
        fadeUp(el, { y: 24 });
    }, { amount: 0.15 });

    inView('[data-stagger]', (el) => {
        animate(Array.from(el.children), { opacity: [0, 1], y: [24, 0] }, { delay: stagger(0.09), duration: 0.75, ease: EASE });
    }, { amount: 0.12 });

    inView('[data-chips]', (group) => {
        fadeUp($('.eyebrow', group), { y: 10, duration: 0.5 });
        animate($$('.chip', group), { opacity: [0, 1], scale: [0.88, 1], y: [8, 0] }, { delay: stagger(0.035, { startDelay: 0.1 }), type: 'spring', stiffness: 420, damping: 26 });
    }, { amount: 0.3 });

    $$('[data-split]').forEach((el) => {
        if (el.closest('.hero')) return;
        const words = splitWords(el);
        inView(el, () => { revealWords(words, 0, 0.08); }, { amount: 0.5 });
    });
}

function initTimeline() {
    const timeline = $('[data-timeline]');
    if (!timeline) return;
    const fill = $('.timeline__fill', timeline);

    scroll(animate(fill, { scaleY: [0, 1] }, { ease: 'linear' }), {
        target: timeline,
        offset: ['start 70%', 'end 55%'],
    });

    $$('.role', timeline).forEach((role) => {
        inView(role, () => {
            animate(role, { opacity: [0, 1], x: [-18, 0] }, { duration: 0.8, ease: EASE });
            animate($('.role__dot', role), { scale: [0, 1.4, 1] }, { duration: 0.6, delay: 0.1, ease: EASE });
            animate($$('li', role), { opacity: [0, 1], x: [-8, 0] }, { delay: stagger(0.06, { startDelay: 0.25 }), duration: 0.5, ease: EASE });
        }, { amount: 0.25 });
    });
}

function initScrollProgress() {
    const bar = $('.scroll-progress');
    if (bar) scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
}

function initContactBar() {
    const bar = $('[data-contact-bar]');
    if (!bar) return;
    animate(bar, { y: '110%' }, { duration: 0 });
    let shown = false;
    const update = () => {
        const show = window.scrollY > window.innerHeight * 0.6;
        if (show === shown) return;
        shown = show;
        animate(bar, { y: show ? '0%' : '110%' }, { duration: 0.45, ease: EASE });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
}

/* Ambient glow drifts after the pointer on desktop. */
function initGlow() {
    const glow = $('.bg-glow');
    if (!glow) return;
    animate(glow, { x: window.innerWidth * 0.65, y: window.innerHeight * 0.3 }, { duration: 0 });
    if (!FINE_POINTER) return;
    let frame = 0;
    window.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
            animate(glow, { x: e.clientX, y: e.clientY }, { type: 'spring', stiffness: 40, damping: 20, mass: 1.2 });
        });
    }, { passive: true });
}

/* Hover micro-interactions (desktop pointers only). */
function initHover() {
    // Cards: cursor spotlight + gentle lift.
    $$('[data-spotlight]').forEach((card) => {
        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });

    $$('.cert').forEach((card) => {
        const icon = $('.cert__icon', card);
        hover(card, () => {
            animate(card, { y: -4 }, SPRING);
            animate(icon, { rotate: [0, -10, 0], scale: [1, 1.12, 1] }, { duration: 0.5, ease: EASE });
            return () => animate(card, { y: 0 }, SPRING);
        });
    });

    // Projects: subtle 3D tilt toward the pointer.
    $$('[data-tilt]').forEach((card) => {
        hover(card, () => {
            animate(card, { y: -6 }, SPRING);
            const onMove = (e) => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                animate(card, { rotateY: px * 6, rotateX: -py * 6, transformPerspective: 900 }, { type: 'spring', stiffness: 260, damping: 24 });
            };
            card.addEventListener('pointermove', onMove);
            return () => {
                card.removeEventListener('pointermove', onMove);
                animate(card, { y: 0, rotateX: 0, rotateY: 0 }, SOFT_SPRING);
            };
        });
    });

    // Buttons: magnetic pull toward the pointer.
    $$('[data-magnetic]').forEach((btn) => {
        hover(btn, () => {
            const onMove = (e) => {
                const r = btn.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                animate(btn, { x: dx * 0.22, y: dy * 0.3 }, { type: 'spring', stiffness: 300, damping: 20 });
            };
            btn.addEventListener('pointermove', onMove);
            return () => {
                btn.removeEventListener('pointermove', onMove);
                animate(btn, { x: 0, y: 0 }, SOFT_SPRING);
            };
        });
    });
}

/* Press feedback works on touch too. */
function initPress() {
    press('.btn, .copy-btn, .menu-btn', (el) => {
        animate(el, { scale: 0.95 }, { duration: 0.12 });
        return () => animate(el, { scale: 1 }, { type: 'spring', stiffness: 520, damping: 24 });
    });
}

/* ------------------------------------------------------------------ */

let terminalApi = null;

function start() {
    terminalApi = initTerminal({ motion: MOTION });
    initNav();
    initMobileMenu();
    initCopy();
    initYear();
    initScrollProgress();

    if (!MOTION) {
        if (terminalApi) terminalApi.activate();
        return;
    }
    initHero();
    initReveals();
    initTimeline();
    initContactBar();
    initGlow();
    initPress();
    if (FINE_POINTER) initHover();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
