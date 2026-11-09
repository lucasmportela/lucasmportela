(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');

  const setMenuOpen = (isOpen) => {
    if (!menuToggle || !nav) return;

    nav.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      setMenuOpen(!nav.classList.contains('is-open'));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    });
  }

  // Mantém apenas uma pergunta do FAQ aberta por vez.
  const faqItems = document.querySelectorAll('.faq-list details');

  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;

      faqItems.forEach((otherItem) => {
        if (otherItem !== item) otherItem.removeAttribute('open');
      });
    });
  });
})();
