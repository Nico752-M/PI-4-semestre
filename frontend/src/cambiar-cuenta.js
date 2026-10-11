(function () {
  if (document.body.classList.contains('agent-page') || document.body.classList.contains('workspace-page')) {
    document.documentElement.classList.add('panel-shell');
  }

  const destinations = {
    cliente: 'index.html',
    agente: 'Agente/dashboard.html',
    admin: 'admin/dashboard.html'
  };
  const labels = {
    cliente: 'Cliente',
    agente: 'Agente',
    admin: 'Administrador'
  };

  function goToAccount(type) {
    if (!Object.prototype.hasOwnProperty.call(destinations, type)) return;

    localStorage.setItem('tipoCuenta', type);
    const inRoleFolder = /\/(?:Agente|admin)\//i.test(location.pathname);
    const root = inRoleFolder ? '../' : '';
    location.href = root + destinations[type];
  }

  document.querySelectorAll('[data-demo-account]').forEach(button => {
    button.addEventListener('click', () => goToAccount(button.dataset.demoAccount));
  });

  const form = document.querySelector('.auth-form');
  if (form && document.body.classList.contains('login-page')) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const type = localStorage.getItem('tipoCuenta') || 'cliente';
      goToAccount(type);
    });
  }

  if (document.body.classList.contains('login-page')) return;

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

  const current = localStorage.getItem('tipoCuenta');
  const switcher = document.createElement('form');
  switcher.className = 'demo-account-switcher';
  switcher.setAttribute('aria-label', 'Cambiar cuenta de demostración');

  const label = document.createElement('label');
  label.htmlFor = 'demo-account-select';
  label.textContent = 'Cuenta demo';

  const select = document.createElement('select');
  select.id = 'demo-account-select';
  select.setAttribute('aria-label', 'Seleccionar cuenta de demostración');

  Object.entries(labels).forEach(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    option.selected = value === current || (!current && value === 'cliente');
    select.appendChild(option);
  });

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Cambiar';

  switcher.addEventListener('submit', event => {
    event.preventDefault();
    goToAccount(select.value);
  });

  switcher.append(label, select, button);
  document.body.appendChild(switcher);
})();
