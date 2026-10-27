(function () {
  const list = document.getElementById('reservationList');
  const status = document.getElementById('reservation-status');
  const resultCount = document.getElementById('resultsCount');
  const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota'
  });
  const timeFormatter = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Bogota'
  });
  list.replaceChildren();
  status.textContent = 'Cargando reservas...';

  function statusType(value) {
    if (value === 'CANCELADA') return 'cancelled';
    if (value === 'CONFIRMADA') return 'confirmed';
    return 'reserved';
  }

  function renderReservation(reservation) {
    const startsAt = new Date(`${reservation.fechaInicio}-05:00`);
    const state = statusType(reservation.estado);
    const article = document.createElement('article');
    article.className = 'reservation';
    article.dataset.status = state;

    const image = document.createElement('div');
    image.className = 'event-image concert';
    const icon = document.createElement('span');
    icon.textContent = '♫';
    const category = document.createElement('div');
    category.className = 'event-category';
    category.textContent = 'Evento';
    image.append(icon, category);

    const info = document.createElement('div');
    info.className = 'event-info';
    const name = document.createElement('div');
    name.className = 'event-name';
    name.textContent = reservation.evento;
    const location = document.createElement('div');
    location.className = 'event-location';
    location.textContent = `● ${reservation.ciudad}, Colombia`;
    const meta = document.createElement('div');
    meta.className = 'event-meta';
    const ticketNumber = document.createElement('span');
    ticketNumber.append(
      state === 'confirmed' ? 'Entrada: ' : 'Código de reserva: ',
      Object.assign(document.createElement('strong'), { textContent: `#${reservation.id}` })
    );
    meta.append(ticketNumber);
    info.append(name, location, meta);

    const dateBlock = document.createElement('div');
    dateBlock.className = 'event-date';
    const dateLabel = document.createElement('div');
    dateLabel.className = 'date-label';
    dateLabel.textContent = 'Fecha del evento';
    const date = document.createElement('div');
    date.className = 'date-main';
    date.textContent = dateFormatter.format(startsAt);
    const time = document.createElement('div');
    time.className = 'date-time';
    time.textContent = timeFormatter.format(startsAt);
    dateBlock.append(dateLabel, date, time);

    const actions = document.createElement('div');
    actions.className = 'reservation-right';
    const badge = document.createElement('div');
    badge.className = `status ${state}`;
    badge.textContent = state === 'confirmed'
      ? '● ENTRADA CONFIRMADA'
      : state === 'reserved'
        ? '● SIN COMPRA'
        : '● CANCELADA';
    const link = document.createElement('a');
    link.className = 'detail-button';
    link.href = `../eventos/detalle.html?id=${encodeURIComponent(reservation.idEvento)}`;
    link.textContent = 'Ver detalles';
    actions.append(badge, link);
    article.append(image, info, dateBlock, actions);
    return article;
  }

  function updateSummary(reservations) {
    const now = Date.now();
    const confirmed = reservations.filter(item => item.estado === 'CONFIRMADA').length;
    const cancelled = reservations.filter(item => item.estado === 'CANCELADA').length;
    const upcoming = reservations
      .filter(item => item.estado === 'CONFIRMADA')
      .map(item => new Date(`${item.fechaInicio}-05:00`))
      .filter(date => date.getTime() >= now)
      .sort((a, b) => a - b)[0];
    const numbers = document.querySelectorAll('.summary-grid .summary-number');
    const labels = document.querySelectorAll('.summary-grid .summary-status');
    numbers[0].textContent = String(reservations.length);
    numbers[1].textContent = String(confirmed);
    numbers[2].textContent = upcoming ? dateFormatter.format(upcoming) : '—';
    numbers[3].textContent = String(cancelled);
    labels[0].textContent = 'Total';
    labels[1].textContent = 'Confirmadas';
    labels[2].textContent = upcoming ? 'Próximo evento' : 'Sin próximos eventos';
    labels[3].textContent = 'Canceladas';
  }

  window.EventStageApi.request('/reservas/mias')
    .then(reservations => {
      list.replaceChildren(...reservations.map(renderReservation));
      updateSummary(reservations);
      resultCount.textContent = `${reservations.length} ${reservations.length === 1 ? 'reserva' : 'reservas'}`;
      status.textContent = reservations.length ? '' : 'Todavía no tienes reservas.';
      document.getElementById('emptyState').style.display = reservations.length ? 'none' : 'block';
    })
    .catch(error => {
      status.textContent = error.message;
      if (error.message === 'Inicia sesión para continuar.') {
        const link = document.createElement('a');
        link.href = `login.html?returnUrl=${encodeURIComponent(location.href)}`;
        link.textContent = ' Inicia sesión para consultar tus reservas.';
        status.append(link);
      }
      list.replaceChildren();
      document.getElementById('emptyState').style.display = 'none';
    });
})();
