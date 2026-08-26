(function () {
    var t = document.getElementById('menu-toggle'),
        m = document.getElementById('mobile-menu'),
        b1 = document.getElementById('bar-1'),
        b2 = document.getElementById('bar-2'),
        b3 = document.getElementById('bar-3'),
        o = !1; // !1 es equivalente a false

    t.addEventListener('click', function () {
        o = !o; // Alterna el estado (true/false)
        m.classList.toggle('hidden', !o);
        t.setAttribute('aria-expanded', o);
        t.setAttribute('aria-label', o ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');

        // Animación de las barras del menú hamburguesa (transforma las líneas en una "X")
        o ? (
            b1.classList.add('translate-y-[7px]', 'rotate-45'),
            b2.classList.add('opacity-0'),
            b3.classList.add('-translate-y-[7px]', '-rotate-45')
        ) : (
            b1.classList.remove('translate-y-[7px]', 'rotate-45'),
            b2.classList.remove('opacity-0'),
            b3.classList.remove('-translate-y-[7px]', '-rotate-45')
        );
    });
})();