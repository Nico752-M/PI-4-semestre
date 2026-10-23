(function () {
  const form = document.getElementById('create-event-form');
  const status = document.getElementById('event-form-status');
  const submitButtons = document.querySelectorAll(
    '#create-event-form [type="submit"], [form="create-event-form"]'
  );
  const country = document.getElementById('event-pais');
  const department = document.getElementById('event-departamento');
  const city = document.getElementById('event-ciudad');

  window.EventStageApi.request('/auth/me')
    .then(({ user }) => {
      if (user.rol !== 'agente') {
        status.textContent = 'Solo una cuenta de agente puede publicar eventos.';
        submitButtons.forEach(button => { button.disabled = true; });
        return;
      }
      const accountName = [
        user.primerNombre,
        user.segundoNombre,
        user.primerApellido,
        user.segundoApellido
      ].filter(Boolean).join(' ');
      document.querySelector('.profile-card strong').textContent = accountName;
      document.querySelector('.profile-card .avatar').textContent =
        accountName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
      window.EventStageApi.setupLocationSelects(country, department, city, status);
    })
    .catch(error => {
      status.textContent = error.message;
      submitButtons.forEach(button => { button.disabled = true; });
      if (error.message === 'Inicia sesión para continuar.') {
        const link = document.createElement('a');
        link.href = `../clientes/login.html?returnUrl=${encodeURIComponent(location.href)}`;
        link.textContent = ' Inicia sesión para publicar un evento.';
        status.append(link);
      }
    });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = 'Publicando evento...';
    submitButtons.forEach(button => { button.disabled = true; });
    try {
      const data = new FormData(form);
      const result = await window.EventStageApi.request('/eventos', {
        method: 'POST',
        body: {
          nombre: data.get('nombre'),
          descripcion: data.get('descripcion'),
          fechaInicio: data.get('fechaInicio'),
          fechaFin: data.get('fechaFin'),
          idCiudad: data.get('idCiudad'),
          precio: data.get('precio'),
          capacidad: data.get('capacidad')
        }
      });
      location.href = `mis-eventos.html?creado=${encodeURIComponent(result.id)}`;
    } catch (error) {
      status.textContent = error.message;
      submitButtons.forEach(button => { button.disabled = false; });
    }
  });
})();
