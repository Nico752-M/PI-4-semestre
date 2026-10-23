(function () {
  const status = document.querySelector('[data-profile-status]');
  document.querySelector('.personal-actions')?.remove();
  document.querySelectorAll('.security-card, .preferences-card, .account-card, .danger-card')
    .forEach(section => section.remove());
  document.querySelector('.top-icon')?.remove();

  window.EventStageApi.request('/auth/me')
    .then(({ user }) => {
      if (user.rol !== 'cliente') throw new Error('Esta página solo está disponible para clientes.');
      const firstNames = [user.primerNombre, user.segundoNombre].filter(Boolean).join(' ');
      const surnames = [user.primerApellido, user.segundoApellido].filter(Boolean).join(' ');
      const fullName = [firstNames, surnames].filter(Boolean).join(' ');
      document.querySelector('.profile-name').textContent = fullName;
      document.querySelector('.profile-email').textContent = user.correo;
      document.getElementById('nombre').value = firstNames;
      document.getElementById('apellido').value = surnames;
      document.getElementById('correo').value = user.correo;
      document.getElementById('telefono').value = user.telefono || 'No registrado';
      document.getElementById('ciudad').value = user.ciudad;
      document.getElementById('pais').value = user.pais;
      document.getElementById('direccion').value = user.departamento;
      document.getElementById('identificacion').value = user.identificacion;
      const initials = fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
      document.querySelectorAll('.avatar-small, .avatar-top, .avatar-large').forEach(avatar => {
        avatar.textContent = initials;
      });
      document.querySelectorAll('.user-name, .top-user-text strong').forEach(name => {
        name.textContent = firstNames;
      });
      status.textContent = '';
    })
    .catch(error => {
      status.textContent = error.message;
      console.error('No se pudo cargar el perfil desde la base de datos.', error);
    });
})();
