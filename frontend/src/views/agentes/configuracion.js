(function () {
  const status = document.querySelector('[data-agent-account-status]');
  window.EventStageApi.request('/auth/me')
    .then(({ user }) => {
      if (user.rol !== 'agente') throw new Error('Esta página solo está disponible para agentes.');
      const name = [
        user.primerNombre,
        user.segundoNombre,
        user.primerApellido,
        user.segundoApellido
      ].filter(Boolean).join(' ');
      document.querySelector('.profile-card strong').textContent = name;
      document.querySelector('.profile-card .avatar').textContent =
        name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
      document.querySelector('[data-agent-account-name]').textContent = [
        user.primerNombre,
        user.segundoNombre,
        user.primerApellido,
        user.segundoApellido
      ].filter(Boolean).join(' ');
      document.querySelector('[data-agent-account-email]').textContent = user.correo;
      document.querySelector('[data-agent-account-phone]').textContent = user.telefono || 'No registrado';
      document.querySelector('[data-agent-account-location]').textContent =
        `${user.ciudad}, ${user.departamento}, ${user.pais}`;
      document.querySelector('[data-agent-account-code]').textContent = user.codigoAgente || '—';
      status.textContent = '';
    })
    .catch(error => {
      status.textContent = error.message;
      console.error('No se pudo cargar la cuenta del agente.', error);
    });
})();
