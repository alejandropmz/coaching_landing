(function () {
    var revealEls = document.querySelectorAll('[data-reveal]');

    // Fallback: show everything if IntersectionObserver is unavailable
    if (!('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) {
            el.classList.remove('opacity-0', 'translate-y-6');
            el.classList.add('opacity-100', 'translate-y-0');
        });
        return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0', 'translate-y-6');
                entry.target.classList.add('opacity-100', 'translate-y-0');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
})();