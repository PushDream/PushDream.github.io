/* Techy Mode interactions. Loaded by techy.html; no inline scripts so the page can run under a strict CSP. */
// MOBILE DETECTION
const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

// 1. BINARY RAIN BACKGROUND
const canvas = document.getElementById('binary-canvas');
const ctx = canvas.getContext('2d');
let width, height, columns;
const fontSize = isMobile ? 12 : 14;
const chars = 'ACNAMETXTNSSOAMX01';
let drops = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.floor(width / fontSize);
    drops = new Array(columns).fill(1);
}

function drawBinary() {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#10b981';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    }
}

window.addEventListener('resize', resize);
resize();
// Slower refresh rate on mobile for better performance
setInterval(drawBinary, isMobile ? 100 : 50);

// 1.5. BOOT SCREEN SEQUENCE
const bootScreen = document.getElementById('boot-screen');
let bootComplete = false;

// Hide boot screen on any key press or after timeout
function hideBootScreen() {
    if (!bootComplete) {
        bootComplete = true;
        gsap.to(bootScreen, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                bootScreen.style.display = 'none';
            }
        });
    }
}

document.addEventListener('keydown', hideBootScreen);
document.addEventListener('click', hideBootScreen);
setTimeout(hideBootScreen, 3500); // Auto-hide after 3.5s

// 1.6. NEON CURSOR TRAILS (Desktop only)
if (!isMobile) {
    let lastTrailTime = 0;
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        // Throttle trail creation to every 50ms for performance
        if (now - lastTrailTime < 50) return;
        lastTrailTime = now;

        // Create trail element
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';
        document.body.appendChild(trail);

        // Remove after animation
        setTimeout(() => {
            trail.remove();
        }, 500);
    });
}

// 1.7. DATA STREAM (Hexadecimal - Desktop only)
if (!isMobile) {
    const dataStream = document.getElementById('data-stream');
    function generateHexData() {
        const chars = '0123456789ABCDEF';
        let result = '';
        for (let i = 0; i < 2000; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
            if ((i + 1) % 40 === 0) result += '\n';
        }
        return result;
    }

    function updateDataStream() {
        dataStream.textContent = generateHexData();
        // Slowly scroll the stream
        gsap.to(dataStream, {
            y: '-=20',
            duration: 1,
            ease: 'none',
            onComplete: () => {
                if (parseInt(dataStream.style.transform?.match(/-?\d+/) || 0) < -1000) {
                    dataStream.style.transform = 'translateY(0)';
                }
            }
        });
    }

    updateDataStream();
    setInterval(updateDataStream, 2000);
}

// 2. TEXT SCRAMBLE UTILITY
const escapeHtml = (c) => c.replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += escapeHtml(to);
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="text-emerald-500">${escapeHtml(char)}</span>`;
            } else {
                output += escapeHtml(from);
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// 3. TARGETING CURSOR (Desktop only)
if (!isMobile) {
    const cMain = document.getElementById('cursor-main');
    const cFollower = document.getElementById('cursor-follower');

    document.addEventListener('mousemove', (e) => {
        gsap.to(cMain, { x: e.clientX - 5, y: e.clientY - 5, duration: 0 });
        gsap.to(cFollower, { x: e.clientX - 20, y: e.clientY - 20, duration: 0.15 });
    });
}

// 4. INTERACTIVE TERMINAL
const cmdInput = document.getElementById('cmd-input');
document.getElementById('terminal-container').addEventListener('click', () => cmdInput.focus());
const terminalOutput = document.getElementById('terminal-output');
const terminalContainer = document.getElementById('terminal-container');

const commands = {
    help: "Available commands: help, whoami, clear, about, projects, skills, contact, social, date, hack, sudo, cv",
    whoami: "guest@boateng-sec // Access Level: VISITOR",
    about: "Navigating to PROFILE...",
    projects: "Navigating to SELECTED_WORK...",
    skills: "Navigating to TOOLKIT...",
    contact: "Opening communication channels...",
    clear: "CLEAR_BUFFER",
    date: "", // Dynamic
    hack: "Initiating BRUTE_FORCE sequence...",
    sudo: "sudo: user is not in the sudoers file. This incident will be reported.",
    cv: "Downloading CV..."
};

cmdInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const input = this.value.trim();
        if (input) {
            processCommand(input.toLowerCase());
        }
        this.value = '';
    }
});

function processCommand(cmd) {
    // Echo command
    printToTerminal(`guest@boateng-sec:~$ ${cmd}`, 'text-zinc-400');

    // Process
    if (cmd === 'clear') {
        terminalOutput.innerHTML = '';
        printToTerminal("> Buffer cleared.", "text-zinc-500");
        return;
    }

    if (cmd === 'date') {
        printToTerminal(`> ${new Date().toString()}`);
        return;
    }

    if (cmd === 'about') {
        printToTerminal(commands.about);
        document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    if (cmd === 'projects') {
        printToTerminal(commands.projects);
        document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    if (cmd === 'skills') {
        printToTerminal(commands.skills);
        document.getElementById('skills').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    if (cmd === 'contact') {
        printToTerminal(commands.contact);
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    if (cmd === 'cv') {
        printToTerminal(commands.cv);
        const link = document.createElement('a');
        link.href = 'cv.pdf';
        link.download = 'cv.pdf';
        link.click();
        return;
    }

    if (cmd === 'hack') {
        printToTerminal(commands.hack, "text-red-500 font-bold");
        triggerHackEffect();
        return;
    }

    if (commands[cmd]) {
        const response = commands[cmd];
        printToTerminal(`> ${response}`, 'text-emerald-500');
    } else {
        printToTerminal(`> Command not found: ${cmd}`, 'text-red-400');
    }
}

function printToTerminal(text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text; // plain text only: typed input is never treated as HTML
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function triggerHackEffect() {
    // A simple visual "freak out"
    document.body.style.filter = "invert(1) hue-rotate(180deg)";
    setTimeout(() => {
        document.body.style.filter = "";
        printToTerminal("> ACCESS DENIED. Firewall active.", "text-red-500");
    }, 500);
}

// 5. CLOCK
function updateClock() {
    document.getElementById('hud-clock').textContent = new Date().toTimeString().split(' ')[0];
}
setInterval(updateClock, 1000);
updateClock();

// 6. INITIALIZE SCRAMBLE & GSAP
gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll('.scramble-text').forEach(el => {
    const fx = new TextScramble(el);
    ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        onEnter: () => fx.setText(el.getAttribute('data-value'))
    });
});

document.querySelectorAll('.reveal').forEach(el => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 90%" },
        opacity: 0, y: 50, duration: 1, ease: "power4.out"
    });
});

// HUD DOTS
const dots = document.querySelectorAll('.scroll-dot');
window.addEventListener('scroll', () => {
    let current = "";
    document.querySelectorAll('section').forEach(s => {
        if (window.scrollY >= s.offsetTop - 300) current = s.id;
    });
    dots.forEach(dot => {
        dot.classList.toggle('active', dot.getAttribute('data-sec') === current);
    });
});

// Magnetic Effect
document.querySelectorAll('.magnetic-wrap').forEach(wrap => {
    wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(wrap, { x: x * 0.3, y: y * 0.3, duration: 0.3 });
    });
    wrap.addEventListener('mouseleave', () => {
        gsap.to(wrap, { x: 0, y: 0, duration: 0.3 });
    });
});


// 7. KONAMI CODE EASTER EGG
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateRedAlert();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0; // Reset if mistake
        if (e.key === 'ArrowUp') konamiIndex = 1; // Allow restart immediately if first key matches
    }
});

function activateRedAlert() {
    // Shake effect
    document.body.classList.add('shake');

    // Color shift logic
    document.documentElement.style.setProperty('--neon', '#dc2626'); // Red color

    // Force redraw/override specific elements that might not use the variable directly
    document.querySelectorAll('.text-emerald-500').forEach(el => {
        el.classList.remove('text-emerald-500');
        el.classList.add('text-red-500');
    });
    document.querySelectorAll('.border-emerald-500').forEach(el => {
        el.classList.remove('border-emerald-500');
        el.classList.add('border-red-500');
    });

    // Terminal announcement
    printToTerminal("> SYSTEM OVERRIDE DETECTED.", "text-red-500 font-bold");
    printToTerminal("> ALERT LEVEL: CRITICAL", "text-red-500 font-bold");
    printToTerminal("> WELCOME, ADMIN.", "text-red-500 font-bold");

    setTimeout(() => {
        document.body.classList.remove('shake');
    }, 1000);
}

// 8. 3D TILT EFFECT
if (!isMobile) {
    document.querySelectorAll('.holo-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max rotation deg
            const rotateY = ((x - centerX) / centerX) * 10;

            gsap.to(card, {
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
                duration: 0.1,
                ease: "power1.out"
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
                duration: 0.5,
                ease: "elastic.out(1, 0.5)"
            });
        });
    });
}

// 9. HACKER TYPING MODE
const hackerCode = [
    "struct group_info init_groups = { .usage = ATOMIC_INIT(2) };",
    "struct group_info *groups_alloc(int gidsetsize){",
    "    struct group_info *group_info;",
    "    int nblocks;",
    "    int i;",
    "    nblocks = (gidsetsize + NGROUPS_PER_BLOCK - 1) / NGROUPS_PER_BLOCK;",
    "    /* Make sure we always allocate at least one indirect block pointer */",
    "    nblocks = nblocks ? : 1;",
    "    group_info = kmalloc(sizeof(*group_info) + nblocks*sizeof(gid_t *), GFP_USER);",
    "    if (!group_info)",
    "        return NULL;",
    "    group_info->ngroups = gidsetsize;",
    "    group_info->nblocks = nblocks;",
    "    atomic_set(&group_info->usage, 1);",
    "    return group_info;",
    "}"
];

const hackerLayer = document.createElement('div');
hackerLayer.id = 'hacker-layer';
hackerLayer.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    z-index: 50;
    padding: 40px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: rgba(16, 185, 129, 0.5);
    overflow: hidden;
    display: none;
`;
document.body.appendChild(hackerLayer);

let codeIndex = 0;
let charIndex = 0;
let hackerModeActive = false;
let hackerTimer;

// Toggle logic: only active if not in input
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape') {
        hackerLayer.style.display = 'none';
        hackerLayer.innerHTML = '';
        hackerModeActive = false;
        return;
    }

    // If not special key, type code
    if (e.key.length === 1) {
        if (!hackerModeActive) {
            hackerModeActive = true;
            hackerLayer.style.display = 'block';
        }

        // Add chunks of code per keypress
        const chunk = 3;
        for (let i = 0; i < chunk; i++) {
            if (codeIndex >= hackerCode.length) codeIndex = 0;

            const line = hackerCode[codeIndex];
            const char = line[charIndex];

            if (char) {
                hackerLayer.innerHTML += char;
                charIndex++;
            } else {
                hackerLayer.innerHTML += '<br>';
                codeIndex++;
                charIndex = 0;
                window.scrollTo(0, document.body.scrollHeight);
            }
        }

        // Auto-fade out after inactivity
        clearTimeout(hackerTimer);
        hackerTimer = setTimeout(() => {
            hackerLayer.style.display = 'none';
            hackerLayer.innerHTML = '';
            hackerModeActive = false;
            codeIndex = 0;
            charIndex = 0;
        }, 3000);
    }
});
