(function () {
  window.EventStageApi.request('/auth/me')
    .then(({ user }) => {
      if (user.rol !== 'cliente') throw new Error('Esta página solo está disponible para clientes.');
      const name = [user.primerNombre, user.segundoNombre, user.primerApellido, user.segundoApellido]
        .filter(Boolean).join(' ');
      const firstNames = [user.primerNombre, user.segundoNombre].filter(Boolean).join(' ');
      document.querySelectorAll('.user-name, .top-user-text strong, .customer-sidebar-user strong')
        .forEach(element => { element.textContent = firstNames; });
      const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
      document.querySelectorAll('.avatar-small, .avatar-top, .customer-sidebar-user > span, .customer-avatar')
        .forEach(element => { element.textContent = initials; });
    })
    .catch(error => {
      const status = document.querySelector('#reservation-status, #history-status, #favorite-status, #settings-status');
      if (status) status.textContent = error.message;
      console.error('No se pudo verificar la cuenta del cliente.', error);
    });
})();
