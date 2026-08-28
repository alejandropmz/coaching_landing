(function () {
    var items = document.querySelectorAll('[data-reveal]');

    if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) {
            el.classList.remove('opacity-0', 'translate-y-8');
            el.classList.add('opacity-100', 'translate-y-0');
        });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                // Cuando el elemento entra en la pantalla (scroll hacia abajo o al llegar a él)
                entry.target.classList.remove('opacity-0', 'translate-y-8');
                entry.target.classList.add('opacity-100', 'translate-y-0');
            } else {
                // Cuando el elemento sale de la pantalla por arriba (hacemos scroll hacia arriba)
                // Se vuelve a ocultar para repetir la animación al volver a bajar
                entry.target.classList.remove('opacity-100', 'translate-y-0');
                entry.target.classList.add('opacity-0', 'translate-y-8');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { observer.observe(el); });
})();