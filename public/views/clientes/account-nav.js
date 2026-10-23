(function () {
  const greeting = document.querySelector('[data-nav-greeting]');
  const guestLinks = document.querySelectorAll('[data-nav-guest]');
  const accountLinks = document.querySelectorAll('[data-nav-account]');
  const logoutButton = document.querySelector('[data-nav-logout]');
  const status = document.querySelector('[data-nav-status]');
  const guestReservationBar = document.querySelector('[data-guest-reservation-bar]');

  function showNavigationError(error) {
    console.error('No se pudo verificar la sesión.', error);
    if (!status) return;
    status.textContent = error.message;
    status.hidden = false;
  }

  window.EventStageApi.request('/auth/me')
    .then(({ user }) => {
      if (greeting) greeting.textContent = `Hola, ${user.primerNombre}`;
      guestLinks.forEach(link => {
        link.hidden = true;
      });
      if (user.rol === 'agente' || user.rol === 'administrador') {
        const panel = user.rol === 'agente'
          ? { href: '../agentes/dashboard.html', label: 'Panel de agente' }
          : { href: '../admins/dashboard.html', label: 'Panel de administración' };
        accountLinks.forEach(link => {
          link.href = panel.href;
          link.textContent = panel.label;
        });
      }
      accountLinks.forEach(link => { link.hidden = false; });
      if (logoutButton) logoutButton.hidden = false;
      if (guestReservationBar) guestReservationBar.hidden = true;
    })
    .catch(error => {
      if (error.status !== 401) showNavigationError(error);
    });

  if (!logoutButton) return;
  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    status.hidden = true;
    try {
      await window.EventStageApi.request('/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      showNavigationError(error);
      logoutButton.disabled = false;
    }
  });
})();
