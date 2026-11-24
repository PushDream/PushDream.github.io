![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-success)
# Owusu-Debrah Boateng — Professional Portfolio

This repository contains the source code for my personal professional portfolio website.

🔗 **Live site:** https://owusuboateng.me

## About
I am an IT Support Specialist with a background in Cyber Security and information engineering, currently pursuing an MSc in Cybersecurity at Maria Curie-Skłodowska University (UMCS), Lublin.

This portfolio presents my professional experience, technical background, certifications, and selected projects.

## Tech Stack
- HTML5 and hand-written CSS (`assets/css/site.css`, no framework)
- Vanilla JavaScript with [Motion](https://motion.dev) for animations
- GitHub Pages

Neither page loads third-party scripts. The animation code in `src/site.js` is
bundled with Motion into `assets/js/site.js`. Techy Mode's Tailwind styles are
built from `src/techy.css` into `assets/css/techy.css`, and its GSAP files are
copied into `assets/js/vendor/`. All of these are committed, so GitHub Pages
needs no build step. To rebuild after a change:

```
npm install
npm run build
```

Animations respect `prefers-reduced-motion`, and every element is shown normally
if JavaScript is off or fails to load.

## Security
- Both pages set a Content-Security-Policy that only allows scripts from this site.
  GitHub Pages cannot send custom headers, so the policy is a meta tag.
- The terminal on the main page may only contact the Cloudflare and Google
  DNS-over-HTTPS resolvers, and treats everything typed as plain text.
- Security contact: `/.well-known/security.txt`.

## Hosting
The site is hosted on **GitHub Pages** with a custom domain and HTTPS enforced.

## Contact
- Portfolio: https://owusuboateng.me
- GitHub: https://github.com/PushDream
