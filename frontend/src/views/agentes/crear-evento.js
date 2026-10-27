(function () {
  const form = document.getElementById('create-event-form');
  const status = document.getElementById('event-form-status');
  const submitButtons = document.querySelectorAll(
    '#create-event-form [type="submit"], [form="create-event-form"]'
  );
  const country = document.getElementById('event-pais');
  const department = document.getElementById('event-departamento');
  const city = document.getElementById('event-ciudad');
  const eventId = new URLSearchParams(location.search).get('editar');
  const isEditing = Boolean(eventId);
  const title = document.querySelector('.page-heading h2');
  const eyebrow = document.querySelector('.page-heading .eyebrow');
  const submitLabels = document.querySelectorAll(
    '#create-event-form [type="submit"], [form="create-event-form"]'
  );

  if (isEditing) {
    document.title = 'Editar evento | EventStage';
    title.textContent = 'Editar evento';
    eyebrow.textContent = 'ACTUALIZAR EVENTO';
    submitLabels.forEach(button => { button.textContent = 'Guardar cambios'; });
  }

  window.EventStageApi.request('/auth/me')
    .then(async ({ user }) => {
      if (!['agente', 'administrador'].includes(user.rol) ||
          (user.rol === 'administrador' && !isEditing)) {
        status.textContent = user.rol === 'administrador'
          ? 'Los administradores pueden editar eventos existentes desde su panel.'
          : 'Solo una cuenta de agente puede publicar eventos.';
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
      if (user.rol === 'administrador') {
        const nav = document.querySelector('.sidebar nav');
        const links = [
          ['Dashboard', '../admins/dashboard.html'],
          ['Eventos', '../admins/eventos.html'],
          ['Usuarios', '../admins/usuarios.html'],
          ['Volver a eventos', '../admins/eventos.html']
        ];
        nav.replaceChildren();
        links.forEach(([label, href]) => {
          const link = document.createElement('a');
          link.href = href;
          link.textContent = label;
          nav.append(link);
        });
        document.querySelector('.brand p').textContent = 'ADMINISTRACIÓN';
        document.querySelector('.profile-card small').textContent = 'Administrador';
      }
      if (isEditing) {
        const existingEvent = await window.EventStageApi.request(`/eventos/${encodeURIComponent(eventId)}`);
        for (const [name, value] of Object.entries({
          nombre: existingEvent.nombre,
          descripcion: existingEvent.descripcion || '',
          fechaInicio: existingEvent.fecha_inicio.slice(0, 16),
          fechaFin: existingEvent.fecha_fin.slice(0, 16),
          precio: existingEvent.precio,
          capacidad: existingEvent.capacidad
        })) {
          form.elements.namedItem(name).value = value;
        }
        await window.EventStageApi.setupLocationSelects(
          country,
          department,
          city,
          status,
          existingEvent.idCiudad
        );
        if (city.value !== String(existingEvent.idCiudad)) {
          throw new Error('No se pudo seleccionar la ubicación actual del evento.');
        }
        status.textContent = 'Edita los datos y guarda los cambios.';
      } else {
        await window.EventStageApi.setupLocationSelects(country, department, city, status);
      }
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
    status.textContent = isEditing ? 'Guardando cambios...' : 'Publicando evento...';
    submitButtons.forEach(button => { button.disabled = true; });
    try {
      const data = new FormData(form);
      const result = await window.EventStageApi.request(
        isEditing ? `/eventos/${encodeURIComponent(eventId)}` : '/eventos',
        {
        method: isEditing ? 'PUT' : 'POST',
        body: {
          nombre: data.get('nombre'),
          descripcion: data.get('descripcion'),
          fechaInicio: data.get('fechaInicio'),
          fechaFin: data.get('fechaFin'),
          idCiudad: data.get('idCiudad'),
          precio: data.get('precio'),
          capacidad: data.get('capacidad')
        }
        }
      );
      if (isEditing && new URLSearchParams(location.search).get('origen') === 'admin') {
        location.href = `../admins/eventos.html?actualizado=${encodeURIComponent(result.id)}`;
        return;
      }
      location.href = isEditing
        ? `mis-eventos.html?actualizado=${encodeURIComponent(result.id)}`
        : `mis-eventos.html?creado=${encodeURIComponent(result.id)}`;
    } catch (error) {
      status.textContent = error.message;
      submitButtons.forEach(button => { button.disabled = false; });
    }
  });
})();
