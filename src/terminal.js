/*
 * The hero terminal. After the intro types itself, visitors get a real prompt.
 * Every answer is read from this page's own sections, so the terminal never
 * says anything the page doesn't.
 */
import { animate, stagger } from 'motion';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

/* ---------- Reading the page ---------- */

function readPage() {
    const roles = $$('.role').map((li) => ({
        date: text($('.role__date', li)),
        title: text($('h3', li)),
        org: text($('.role__org', li)),
    }));
    const skills = $$('.chip-group').map((g) => ({
        group: text($('.eyebrow', g)),
        items: $$('.chip', g).map(text),
    }));
    const certs = $$('.cert').map((c) => ({
        name: text($('h3', c)),
        detail: text($('p', c)),
        href: c.tagName === 'A' ? c.getAttribute('href') : null,
    }));
    const study = $$('.academic__item').map((li) => ({
        name: text($('h4', li)),
        detail: text($('p', li)),
    }));
    const projects = $$('.project').map((p) => {
        const link = $('a[href^="http"]', p);
        return {
            name: text($('h3', p)),
            kicker: text($('.project__kicker', p)),
            tags: $$('.chip', p).map(text),
            href: link ? link.getAttribute('href') : null,
        };
    });
    const email = $('.contact__address');
    const links = $$('.contact__links a[href^="http"]').map((a) => ({ label: text(a), href: a.getAttribute('href') }));
    const cv = $('a[href$="cv.pdf"]');
    const sections = $$('main section[id]').filter((s) => s.id !== 'top').map((s) => ({
        id: s.id,
        title: text($('h2', s)),
    }));

    return {
        name: text($('.hero__name')),
        headline: text($('.hero__lead strong')),
        status: text($('.hero .status-chip span:last-child')),
        about: text($('#about .lead')),
        roles, skills, certs, study, projects, sections,
        email: email ? { label: text(email), href: email.getAttribute('href') } : null,
        links,
        cv: cv ? cv.getAttribute('href') : null,
    };
}

/* ---------- Output lines ---------- */

/* A line is a list of parts: strings, or { text, cls, href }. */
function makeLine(parts, cls = 't-res') {
    const line = document.createElement('span');
    line.className = `t-line ${cls}`;
    for (const part of [].concat(parts)) {
        if (typeof part === 'string') { line.append(part); continue; }
        let node;
        if (part.href) {
            node = document.createElement('a');
            node.href = part.href;
            if (/^https?:/.test(part.href)) { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
            if (part.download) node.setAttribute('download', '');
        } else {
            node = document.createElement('span');
        }
        if (part.cls) node.className = part.cls;
        node.textContent = part.text;
        line.append(node);
    }
    return line;
}

const pad = (s, n) => (s.length >= n ? `${s}  ` : s + ' '.repeat(n - s.length));
const host = (href) => href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

/* ---------- dig, over DNS-over-HTTPS ---------- */

/* Real lookups, run from the visitor's own browser against public resolvers.
   Nothing is sent anywhere else, and answers are shown as plain text. */
const DNS_TYPES = { A: 1, NS: 2, CNAME: 5, SOA: 6, MX: 15, TXT: 16, AAAA: 28, CAA: 257 };
const DNS_NAMES = Object.fromEntries(Object.entries(DNS_TYPES).map(([k, v]) => [v, k]));
const RCODES = { 0: 'NOERROR', 1: 'FORMERR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 4: 'NOTIMP', 5: 'REFUSED' };
const RESOLVERS = [
    { name: 'Cloudflare', url: (n, t) => `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(n)}&type=${t}` },
    { name: 'Google', url: (n, t) => `https://dns.google/resolve?name=${encodeURIComponent(n)}&type=${t}` },
];
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const err = (msg) => [[{ text: msg, cls: 't-err' }]];

function formatAnswer(name, type, data, ms, via) {
    const status = RCODES[data.Status] || `RCODE ${data.Status}`;
    const answers = Array.isArray(data.Answer) ? data.Answer : [];
    const count = `${answers.length} answer${answers.length === 1 ? '' : 's'}`;
    const lines = [[{ text: `;; ${type} ${name}  status: ${status}  ${count}  ${ms} ms via ${via}`, cls: 't-dim' }]];
    if (!answers.length) {
        lines.push([{ text: status === 'NXDOMAIN' ? ';; that name does not exist.' : `;; no ${type} records for this name.`, cls: 't-dim' }]);
        return lines;
    }
    const rows = answers.map((a) => [a.name || name, String(a.TTL ?? ''), DNS_NAMES[a.type] || `TYPE${a.type}`, String(a.data ?? '')]);
    const w0 = Math.min(Math.max(...rows.map((r) => r[0].length)), 34);
    const w1 = Math.max(...rows.map((r) => r[1].length));
    const w2 = Math.max(...rows.map((r) => r[2].length));
    rows.forEach((r) => lines.push([
        { text: pad(r[0], w0 + 1), cls: 't-head' },
        { text: pad(r[1], w1 + 1), cls: 't-dim' },
        pad(`IN ${r[2]}`, w2 + 4),
        r[3],
    ]));
    return lines;
}

async function dig(arg) {
    const parts = arg.split(/\s+/).filter(Boolean);
    if (!parts.length) return [[{ text: 'Usage: dig <domain> [type], for example dig example.com mx', cls: 't-dim' }]];
    let [name, type = 'a'] = parts;
    if (DNS_TYPES[name.toUpperCase()] && parts[1]) [type, name] = [name, parts[1]];
    name = name.replace(/^[a-z]+:\/\//, '').replace(/[/?#].*$/, '').replace(/\.$/, '');
    type = type.toUpperCase();
    if (!DNS_TYPES[type]) return err(`dig: ${type} is not supported here. Try A, AAAA, CNAME, MX, TXT, NS, SOA or CAA.`);
    if (!DOMAIN_RE.test(name)) return err(`dig: ${name} does not look like a domain name.`);
    if (typeof fetch !== 'function') return err('dig: this browser cannot make lookups.');

    for (const resolver of RESOLVERS) {
        const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 6000) : null;
        try {
            const started = performance.now();
            const res = await fetch(resolver.url(name, type), {
                headers: { accept: 'application/dns-json' },
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                signal: ctrl ? ctrl.signal : undefined,
            });
            if (!res.ok) continue;
            const data = await res.json();
            return formatAnswer(name, type, data, Math.round(performance.now() - started), resolver.name);
        } catch (e) {
            /* Try the next resolver. */
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
    return err('dig: could not reach a public resolver from this browser.');
}

/* ---------- Commands ---------- */

function buildCommands(page, api) {
    const cmds = {
        help: {
            about: 'list commands',
            run: () => [
                [{ text: 'Available commands:', cls: 't-head' }],
                ...Object.entries(cmds)
                    .filter(([, c]) => c.about)
                    .map(([name, c]) => ['  ', { text: pad(name, 12), cls: 't-kbd' }, c.about]),
                [{ text: 'Up and down arrows recall earlier commands. Tab completes.', cls: 't-dim' }],
            ],
        },
        whoami: {
            about: 'who this is',
            run: () => [[page.name.toLowerCase()], [page.headline]],
        },
        about: {
            about: 'short profile',
            run: () => [[page.about]],
        },
        experience: {
            about: 'roles, newest first',
            run: () => page.roles.flatMap((r) => [
                [{ text: r.date, cls: 't-dim' }],
                ['  ', { text: r.title, cls: 't-head' }, `  ${r.org}`],
            ]),
        },
        skills: {
            about: 'technical toolkit',
            run: () => page.skills.flatMap((g) => [
                [{ text: g.group, cls: 't-head' }],
                ...g.items.map((i) => [`  ${i}`]),
            ]),
        },
        certs: {
            about: 'certifications',
            run: () => page.certs.map((c) => [
                { text: c.name, cls: 't-head' }, `  ${c.detail}`,
                ...(c.href ? ['  ', { text: 'badge ↗', href: c.href }] : []),
            ]),
        },
        study: {
            about: 'academic path',
            run: () => page.study.map((s) => [{ text: s.name, cls: 't-head' }, `  ${s.detail}`]),
        },
        projects: {
            about: 'selected work',
            run: () => page.projects.flatMap((p) => [
                [{ text: p.name, cls: 't-head' }, `  ${p.kicker}`],
                ['  ', p.tags.join(' · '), ...(p.href ? ['  ', { text: `${host(p.href)} ↗`, href: p.href }] : [])],
            ]),
        },
        dig: {
            about: 'look up DNS records, e.g. dig example.com mx',
            run: (arg) => dig(arg),
        },
        contact: {
            about: 'email and profiles',
            run: () => [
                ...(page.email ? [[pad('email', 10), { text: page.email.label, href: page.email.href }]] : []),
                ...page.links.map((l) => [pad(l.label.split(' ')[0].toLowerCase(), 10), { text: host(l.href), href: l.href }]),
            ],
        },
        cv: {
            about: 'download the CV (PDF)',
            run: () => (page.cv
                ? [['CV: ', { text: page.cv, href: page.cv, download: true }]]
                : [[{ text: 'No CV link on this page.', cls: 't-err' }]]),
        },
        ls: {
            about: 'sections of this page',
            run: () => [[page.sections.map((s) => s.id).join('  ')], [{ text: 'Try cd <section> to jump there.', cls: 't-dim' }]],
        },
        cd: {
            run: (arg) => {
                const target = page.sections.find((s) => s.id === arg);
                if (!arg) return [[{ text: 'Usage: cd <section>. Type ls to see them.', cls: 't-dim' }]];
                if (!target) return [[{ text: `cd: no such section: ${arg}`, cls: 't-err' }]];
                api.jump(target.id);
                return [[`Jumping to ${target.title}.`]];
            },
        },
        history: {
            about: 'commands you ran',
            run: () => (api.history.length
                ? api.history.map((h, i) => [{ text: pad(String(i + 1), 4), cls: 't-dim' }, h])
                : [[{ text: 'No commands yet.', cls: 't-dim' }]]),
        },
        clear: {
            about: 'clear the screen',
            run: () => { api.clear(); return []; },
        },
        sudo: {
            run: () => [[{ text: 'Permission denied. Good instinct to check, though.', cls: 't-err' }]],
        },
    };

    const aliases = {
        '?': 'help', man: 'help', role: 'whoami', profile: 'about', work: 'experience', jobs: 'experience',
        toolkit: 'skills', certifications: 'certs', education: 'study', email: 'contact', resume: 'cv', cls: 'clear',
    };
    return { cmds, aliases };
}

/* ---------- Terminal ---------- */

export function initTerminal({ motion }) {
    const term = $('[data-term]');
    if (!term) return null;
    const body = $('[data-term-body]', term);
    const log = $('[data-term-log]', term);
    const form = $('[data-term-form]', term);
    const input = $('#term-input', term);
    const chips = $('[data-term-chips]', term);
    const intro = $('[data-terminal]', term);
    if (!body || !log || !form || !input) return null;

    const history = [];
    let cursor = 0;
    let page = null;

    const api = {
        history,
        clear: () => {
            log.replaceChildren();
            if (intro) intro.hidden = true;
        },
        jump: (id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
            if (history.length) window.history.replaceState(null, '', `#${id}`);
        },
    };

    let commands = null;
    const getCommands = () => {
        if (!commands) { page = readPage(); commands = buildCommands(page, api); }
        return commands;
    };

    const scrollToEnd = () => { body.scrollTop = body.scrollHeight; };

    function print(lines) {
        const nodes = lines.map((l) => makeLine(l));
        const block = document.createElement('div');
        block.className = 't-block';
        block.append(...nodes);
        log.append(block);
        if (motion && nodes.length) {
            animate(nodes, { opacity: [0, 1], x: [-6, 0] }, { delay: stagger(0.025), duration: 0.3, ease: [0.16, 1, 0.3, 1] });
        }
        scrollToEnd();
    }

    function run(raw, { quiet = false } = {}) {
        const value = raw.trim();
        const echo = makeLine([{ text: '$', cls: 't-prompt' }, ` ${value}`], 't-cmd');
        if (!value) { log.append(echo); scrollToEnd(); return; }

        if (!quiet) {
            history.push(value);
            if (history.length > 50) history.shift();
            cursor = history.length;
        }

        const [word, ...rest] = value.split(/\s+/);
        const { cmds, aliases } = getCommands();
        const name = word.toLowerCase();
        const cmd = cmds[name] || cmds[aliases[name]];

        log.append(echo);
        if (!cmd) {
            print([[{ text: `command not found: ${word}`, cls: 't-err' }, '. Type ', { text: 'help', cls: 't-kbd' }, ' to see what works.']]);
            return;
        }
        const out = cmd.run(rest.join(' ').toLowerCase());
        if (out && typeof out.then === 'function') {
            /* An automatic lookup on page load should not be read aloud. */
            if (quiet) log.setAttribute('aria-live', 'off');
            const pending = makeLine([{ text: ';; asking a resolver...', cls: 't-dim' }]);
            log.append(pending);
            scrollToEnd();
            const done = (lines) => {
                pending.remove();
                print(lines);
                if (quiet) log.setAttribute('aria-live', 'polite');
            };
            out.then(done, () => done(err('dig: the lookup failed.')));
            return;
        }
        if (out.length) print(out); else scrollToEnd();
    }

    function complete() {
        const value = input.value.trim().toLowerCase();
        if (!value || value.includes(' ')) return false;
        const { cmds } = getCommands();
        const matches = Object.keys(cmds).filter((c) => c.startsWith(value) && c !== value);
        if (matches.length === 1) { input.value = matches[0]; return true; }
        if (matches.length > 1) {
            log.append(makeLine([{ text: '$', cls: 't-prompt' }, ` ${input.value}`], 't-cmd'));
            print([[matches.join('  ')]]);
            return true;
        }
        return false;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        run(input.value);
        input.value = '';
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            if (!history.length) return;
            e.preventDefault();
            cursor = Math.max(0, cursor - 1);
            input.value = history[cursor];
            requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
        } else if (e.key === 'ArrowDown') {
            if (!history.length) return;
            e.preventDefault();
            cursor = Math.min(history.length, cursor + 1);
            input.value = history[cursor] || '';
        } else if (e.key === 'Tab' && !e.shiftKey) {
            /* Only keep Tab when it completed something, so keyboard users can always tab out. */
            if (complete()) e.preventDefault();
        } else if (e.key === 'Escape') {
            input.value = '';
        } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
            e.preventDefault();
            api.clear();
        }
    });

    /* Clicking the screen focuses the prompt, unless the visitor is selecting text or using a link. */
    body.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        if (window.getSelection && String(window.getSelection())) return;
        input.focus({ preventScroll: true });
    });

    if (chips) {
        chips.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-cmd]');
            if (!btn) return;
            run(btn.dataset.cmd);
        });
    }

    /* Swap the idle cursor for the live prompt. */
    function activate() {
        const idle = $('[data-term-idle]', term);
        if (idle) idle.remove();
        form.hidden = false;
        if (chips) chips.hidden = false;
        term.classList.add('is-live');
        if (motion) {
            animate(form, { opacity: [0, 1] }, { duration: 0.3 });
            if (chips) animate(chips, { opacity: [0, 1], y: [8, 0] }, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
        }
    }

    return { activate, run };
}
