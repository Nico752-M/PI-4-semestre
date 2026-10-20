(function () {
  const greeting = document.querySelector('[data-nav-greeting]');
  const guestLinks = document.querySelectorAll('[data-nav-guest]');
  const accountLink = document.querySelector('[data-nav-account]');
  const logoutButton = document.querySelector('[data-nav-logout]');
  const status = document.querySelector('[data-nav-status]');

  function showNavigationError(error) {
    status.textContent = error.message;
    status.hidden = false;
    console.error('No se pudo verificar la sesión.', error);
  }

  window.EventStageApi.request('/auth/me')
    .then(({ user }) => {
      greeting.textContent = `Hola, ${user.primerNombre}`;
      guestLinks.forEach(link => {
        link.hidden = true;
      });
      if (user.rol === 'agente') {
        accountLink.href = '../agentes/dashboard.html';
        accountLink.textContent = 'Panel de agente';
      } else if (user.rol === 'administrador') {
        accountLink.href = '../admins/dashboard.html';
        accountLink.textContent = 'Panel de administración';
      }
      accountLink.hidden = false;
      logoutButton.hidden = false;
    })
    .catch(error => {
      if (error.status !== 401) showNavigationError(error);
    });

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
