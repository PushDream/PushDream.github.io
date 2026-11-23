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

The main page (`index.html`) has no third-party scripts. The animation code in
`src/site.js` is bundled with Motion into `assets/js/site.js`, which is committed,
so GitHub Pages needs no build step. To change the animations:

```
npm install
npm run build
```

Animations respect `prefers-reduced-motion`, and every element is shown normally
if JavaScript is off or fails to load.

## Hosting
The site is hosted on **GitHub Pages** with a custom domain and HTTPS enabled.

## Contact
- Portfolio: https://owusuboateng.me
- GitHub: https://github.com/PushDream
