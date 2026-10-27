(function () {
  const body = document.querySelector('[data-attendees-rows]');
  const status = document.querySelector('[data-attendees-status]');
  const date = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone: 'America/Bogota'
  });

  function renderReservation(reservation) {
    const row = document.createElement('tr');
    const attendee = document.createElement('td');
    const name = document.createElement('strong');
    name.textContent = [
      reservation.primerNombre,
      reservation.segundoNombre,
      reservation.primerApellido,
      reservation.segundoApellido
    ].filter(Boolean).join(' ');
    const email = document.createElement('small');
    email.textContent = reservation.correo;
    attendee.append(name, email);

    const event = document.createElement('td');
    const link = document.createElement('a');
    link.href = `../eventos/detalle.html?id=${encodeURIComponent(reservation.idEvento)}`;
    link.textContent = reservation.evento;
    event.append(link);
    const state = document.createElement('td');
    state.textContent = reservation.estado;
    const reservedAt = document.createElement('td');
    reservedAt.textContent = date.format(new Date(reservation.fechaReserva));
    row.append(attendee, event, state, reservedAt);
    return row;
  }

  Promise.all([
    window.EventStageApi.request('/auth/me'),
    window.EventStageApi.request('/reservas/agente')
  ]).then(([{ user }, reservations]) => {
    if (user.rol !== 'agente') throw new Error('Esta página solo está disponible para agentes.');
    const accountName = [
      user.primerNombre,
      user.segundoNombre,
      user.primerApellido,
      user.segundoApellido
    ].filter(Boolean).join(' ');
    document.querySelector('.profile-card strong').textContent = accountName;
    document.querySelector('.profile-card .avatar').textContent =
      accountName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    body.replaceChildren(...reservations.map(renderReservation));
    document.querySelectorAll('[data-attendee-count]').forEach(element => {
      element.textContent = String(reservations.length);
    });
    if (!reservations.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent = 'No hay reservas para tus eventos.';
      row.append(cell);
      body.append(row);
    }
    status.textContent = '';
  }).catch(error => {
    status.textContent = error.message;
    console.error('No se pudieron cargar los asistentes.', error);
  });
})();
