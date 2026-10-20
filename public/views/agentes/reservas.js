(function () {
  const body = document.querySelector('[data-agent-reservations]');
  const currency = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
  const date = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  body.replaceChildren();
  const status = document.querySelector('[data-agent-reservations-status]');
  status.textContent = 'Cargando reservas...';

  function renderReservation(reservation) {
    const row = document.createElement('tr');
    const attendee = document.createElement('td');
    const user = document.createElement('div');
    user.className = 'user-cell';
    const avatar = document.createElement('span');
    avatar.className = 'avatar-badge';
    avatar.textContent = `${reservation.primerNombre[0]}${reservation.primerApellido[0]}`.toUpperCase();
    const identity = document.createElement('div');
    const fullName = document.createElement('strong');
    fullName.textContent = [
      reservation.primerNombre,
      reservation.segundoNombre,
      reservation.primerApellido,
      reservation.segundoApellido
    ].filter(Boolean).join(' ');
    const email = document.createElement('small');
    email.textContent = reservation.correo;
    identity.append(fullName, document.createElement('br'), email);
    user.append(avatar, identity);
    attendee.append(user);

    const event = document.createElement('td');
    const link = document.createElement('a');
    link.href = `../eventos/detalle.html?id=${encodeURIComponent(reservation.idEvento)}`;
    link.textContent = reservation.evento;
    event.append(link);

    const value = document.createElement('td');
    value.textContent = Number(reservation.precio) === 0 ? 'Gratis' : currency.format(reservation.precio);
    const status = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = reservation.estado === 'CONFIRMADA' ? 'badge confirmed' : 'badge reserved';
    badge.textContent = reservation.estado;
    status.append(badge);
    const reservedAt = document.createElement('td');
    reservedAt.textContent = date.format(new Date(reservation.fechaReserva));
    row.append(attendee, event, value, status, reservedAt);
    return row;
  }

  window.EventStageApi.request('/reservas/agente')
    .then(reservations => {
      body.replaceChildren(...reservations.map(renderReservation));
      document.querySelector('[data-reservations-total]').textContent = String(reservations.length);
      document.querySelector('[data-reservations-confirmed]').textContent =
        String(reservations.filter(item => item.estado === 'CONFIRMADA').length);
      document.querySelector('[data-reservations-pending]').textContent =
        String(reservations.filter(item => item.estado === 'PENDIENTE').length);
      document.querySelector('[data-reservations-count]').textContent =
        `· ${reservations.length} resultado(s)`;
      if (!reservations.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = 'Todavía no tienes reservas en tus eventos.';
        row.append(cell);
        body.append(row);
      }
    })
    .catch(error => {
      status.textContent = error.message;
      if (error.message === 'Inicia sesión para continuar.') {
        const link = document.createElement('a');
        link.href = `../clientes/login.html?returnUrl=${encodeURIComponent(location.href)}`;
        link.textContent = ' Inicia sesión para consultar las reservas.';
        status.append(link);
      }
      document.querySelector('[data-reservations-count]').textContent = '· No disponible';
    });
})();
