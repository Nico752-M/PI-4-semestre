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
