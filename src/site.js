/*
 * owusuboateng.me interactions. Built with Motion (https://motion.dev).
 * Source for assets/js/site.js:  npm install && npm run build
 *
 * Motion is used in three places only: the highlighter marks, the mobile menu,
 * and terminal output. Everything else stays still on purpose.
 */
import { animate, inView, stagger } from 'motion';
import { initTerminal } from './terminal.js';

window.__siteMotionReady = true;

const root = document.documentElement;
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const MOTION = root.classList.contains('motion-ok') && !reduceQuery.matches;
const DESKTOP = window.matchMedia('(min-width: 900px)');
const EASE = [0.22, 1, 0.36, 1];

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function go(target, keyframes, options = {}) {
    return animate(target, keyframes, MOTION ? options : { duration: 0 });
}

function initNav() {
    const nav = $('[data-nav]');
    const links = $$('.nav__link');
    const linkFor = (id) => links.find((l) => l.getAttribute('href') === '#' + id);

    const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const sectionMap = { top: null, about: 'about', projects: 'projects', experience: 'experience', skills: 'skills', certifications: 'skills', contact: 'contact' };
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
    }, { rootMargin: '-40% 0px -55% 0px' });
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
        go(menu, { opacity: [0, 1] }, { duration: 0.2 });
        go(items, { opacity: [0, 1], x: [-12, 0] }, { delay: stagger(0.04, { startDelay: 0.05 }), duration: 0.35, ease: EASE });
        items[0]?.focus();
    }

    function close(returnFocus = true) {
        openBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        const done = () => {
            menu.hidden = true;
            menu.style.opacity = '';
            if (returnFocus) openBtn.focus();
        };
        if (MOTION) animate(menu, { opacity: 0 }, { duration: 0.15 }).then(done);
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
        clearTimeout(timer);
        timer = setTimeout(() => { label.textContent = 'Copy'; }, 2000);
    });
}

function initYear() {
    const el = $('[data-year]');
    if (el) el.textContent = String(new Date().getFullYear());
}

/* Highlighter marks draw across once, the first time they are read. */
function initMarks() {
    const marks = $$('mark.hl');
    if (!MOTION) {
        marks.forEach((m) => m.classList.add('is-marked'));
        return;
    }
    marks.forEach((mark) => {
        inView(mark, () => {
            animate(mark, { backgroundSize: ['0% 100%', '100% 100%'] }, { duration: 0.7, ease: EASE, delay: 0.15 })
                .then(() => mark.classList.add('is-marked'));
        }, { amount: 0.5, margin: '0px 0px -15% 0px' });
    });
}

function start() {
    initNav();
    initMobileMenu();
    initCopy();
    initYear();
    initMarks();

    const terminal = initTerminal({ motion: MOTION });
    if (terminal) {
        terminal.activate();
        /* The terminal opens on a real lookup of this site's own DNS. */
        terminal.run('dig owusuboateng.me', { quiet: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
