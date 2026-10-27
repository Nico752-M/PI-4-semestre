(function () {
  const expectedRole = document.body.dataset.requiredRole;
  if (!expectedRole) return;
  const allowedRoles = expectedRole.split(',').map(role => role.trim());

  window.EventStageApi.request('/auth/me')
    .then(({ user }) => {
      if (!allowedRoles.includes(user.rol)) {
        throw new Error(`Esta página solo está disponible para cuentas de ${expectedRole}.`);
      }
      const name = [user.primerNombre, user.segundoNombre, user.primerApellido, user.segundoApellido]
        .filter(Boolean).join(' ');
      const profile = document.querySelector('.profile-card');
      if (profile) {
        profile.querySelector('strong').textContent = name;
        profile.querySelector('.avatar').textContent = name.split(/\s+/).slice(0, 2)
          .map(part => part[0]).join('').toUpperCase();
      }
    })
    .catch(error => {
      if (error.status === 401) {
        const loginPath = allowedRoles.length === 1 && allowedRoles[0] === 'administrador'
          ? '/views/admins/login.html'
          : '/views/clientes/login.html';
        const returnUrl = encodeURIComponent(location.href);
        location.replace(`${loginPath}?returnUrl=${returnUrl}`);
        return;
      }
      const main = document.querySelector('main');
      const message = document.createElement('p');
      message.setAttribute('role', 'alert');
      message.textContent = error.message;
      const loginLink = document.createElement('a');
      loginLink.href = allowedRoles.length === 1 && allowedRoles[0] === 'administrador'
        ? '/views/admins/login.html'
        : '/views/clientes/login.html';
      loginLink.textContent = 'Ir al inicio de sesión';
      message.append(' ', loginLink);
      if (main) main.prepend(message);
      console.error('No se pudo verificar el acceso al panel.', error);
    });
})();
