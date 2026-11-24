/* Runs before the page paints. Kept in its own file so the page needs no inline scripts. */
(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
        document.documentElement.classList.add('motion-ok');
        // Safety net: if the animation script fails to load, show everything.
        setTimeout(function () {
            if (!window.__siteMotionReady) document.documentElement.classList.remove('motion-ok');
        }, 2500);
    }
})();
