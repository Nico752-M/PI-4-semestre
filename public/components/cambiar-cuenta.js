(function () {
  if (document.body.classList.contains('agent-page') || document.body.classList.contains('workspace-page')) {
    document.documentElement.classList.add('panel-shell');
  }

  const isCustomerPanel = [
    'customer-page',
    'perfil-page',
    'misreservas-page',
    'historialdecompras-page'
  ].some(className => document.body.classList.contains(className));
  const isWorkspace = document.body.classList.contains('agent-page') ||
    document.body.classList.contains('workspace-page');
  const header = document.querySelector(
    '.customer-topbar, .workspace-topbar, .top-header, .topbar'
  );
  if ((isCustomerPanel || isWorkspace) && header) {
    const homeLink = document.createElement('a');
    homeLink.className = 'workspace-home-link';
    homeLink.href = '/views/clientes/index.html';
    homeLink.textContent = '← Volver al inicio';
    header.prepend(homeLink);
  }

  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mobile-sidebar-toggle';
    toggle.setAttribute('aria-label', 'Abrir menú');
    toggle.setAttribute('aria-controls', 'mobile-navigation');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '☰';
    sidebar.id = sidebar.id || 'mobile-navigation';

    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'mobile-sidebar-backdrop';
    backdrop.setAttribute('aria-label', 'Cerrar menú');
    backdrop.tabIndex = -1;

    document.body.append(backdrop, toggle);

    const closeMenu = (returnFocus = false) => {
      document.body.classList.remove('mobile-sidebar-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      toggle.textContent = '☰';
      if (returnFocus) toggle.focus();
    };
    const openMenu = () => {
      document.body.classList.add('mobile-sidebar-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Cerrar menú');
      toggle.textContent = '×';
      const firstLink = sidebar.querySelector('a[href]');
      if (firstLink) firstLink.focus();
    };

    toggle.addEventListener('click', () => {
      if (document.body.classList.contains('mobile-sidebar-open')) closeMenu();
      else openMenu();
    });
    backdrop.addEventListener('click', () => closeMenu(true));
    sidebar.addEventListener('click', event => {
      if (event.target.closest('a[href]')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.body.classList.contains('mobile-sidebar-open')) {
        closeMenu();
        toggle.focus();
      } else if (event.key === 'Tab' && document.body.classList.contains('mobile-sidebar-open')) {
        const focusable = sidebar.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

})();
