(function () {
  const expectedRole = document.body.dataset.requiredRole;
  if (!expectedRole) return;

  window.EventStageApi.request('/auth/me')
    .then(({ user }) => {
      if (user.rol !== expectedRole) {
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
      const main = document.querySelector('main');
      const message = document.createElement('p');
      message.setAttribute('role', 'alert');
      message.textContent = error.message;
      main.prepend(message);
      console.error('No se pudo verificar el acceso al panel.', error);
    });
})();
