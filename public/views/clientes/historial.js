(function () {
  const list = document.getElementById('purchaseList');
  const status = document.getElementById('history-status');
  const currency = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
  const date = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone: 'America/Bogota'
  });
  let reservations = [];
  let activeFilter = 'all';

  list.replaceChildren();
  status.textContent = 'Cargando reservas...';

  function renderReservation(reservation) {
    const item = document.createElement('article');
    item.className = 'purchase';
    const statusFilters = {
      PENDIENTE: 'pending',
      CANCELADA: 'cancelled',
      CONFIRMADA: 'completed'
    };
    item.dataset.status = statusFilters[reservation.estado] || '';
    const icon = document.createElement('div');
    icon.className = 'event-icon';
    icon.textContent = '♫';
    const details = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'event-name';
    title.textContent = reservation.evento;
    const ticketCode = document.createElement('div');
    ticketCode.className = 'event-location';
    ticketCode.textContent = reservation.estado === 'CONFIRMADA'
      ? `Entrada confirmada · Código #${reservation.id}`
      : `Código de reserva #${reservation.id} · ${reservation.estado}`;
    const location = document.createElement('div');
    location.className = 'event-location';
    location.textContent = `${reservation.ciudad} · ${date.format(new Date(`${reservation.fechaInicio}-05:00`))}`;
    details.append(title, ticketCode, location);

    const reservationDate = document.createElement('div');
    reservationDate.append(
      Object.assign(document.createElement('div'), { className: 'purchase-label', textContent: 'Fecha de reserva' }),
      Object.assign(document.createElement('div'), { className: 'purchase-data', textContent: date.format(new Date(reservation.fechaReserva)) })
    );
    const value = document.createElement('div');
    value.append(
      Object.assign(document.createElement('div'), { className: 'purchase-label', textContent: 'Precio actual del evento' }),
      Object.assign(document.createElement('div'), {
        className: 'purchase-data price',
        textContent: Number(reservation.precio) === 0 ? 'Gratis' : currency.format(reservation.precio)
      })
    );
    const state = document.createElement('div');
    state.className = `status-column status ${item.dataset.status}`;
    state.textContent = reservation.estado;
    const link = document.createElement('a');
    link.className = 'details-btn';
    link.href = `../eventos/detalle.html?id=${encodeURIComponent(reservation.idEvento)}`;
    link.textContent = 'Ver evento';
    item.append(icon, details, reservationDate, value, state, link);
    return item;
  }

  function applyFilters() {
    const query = document.getElementById('search').value.trim().toLocaleLowerCase('es-CO');
    const items = list.querySelectorAll('.purchase');
    let visible = 0;
    items.forEach(item => {
      const matches = (activeFilter === 'all' || item.dataset.status === activeFilter) &&
        item.textContent.toLocaleLowerCase('es-CO').includes(query);
      item.style.display = matches ? 'grid' : 'none';
      if (matches) visible += 1;
    });
    document.getElementById('purchaseCount').textContent = `${visible} reserva(s)`;
    document.getElementById('empty').style.display = visible ? 'none' : 'block';
  }

  window.filtrar = (filter, button) => {
    activeFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    applyFilters();
  };
  window.buscar = applyFilters;

  window.EventStageApi.request('/reservas/mias')
    .then(result => {
      reservations = result;
      list.replaceChildren(...reservations.map(renderReservation));
      document.getElementById('totalCompras').textContent = String(reservations.length);
      const confirmed = reservations.filter(item => item.estado === 'CONFIRMADA');
      document.getElementById('completadas').textContent = String(confirmed.length);
      document.querySelector('.summary-value.gold').textContent = currency.format(
        confirmed.reduce((total, item) => total + Number(item.precio), 0)
      );
      const latest = confirmed[0];
      const latestCard = document.querySelector('.summary-grid .summary-card:last-child');
      latestCard.querySelector('.summary-value').textContent =
        latest ? date.format(new Date(latest.fechaReserva)) : '—';
      latestCard.querySelector('.summary-extra').textContent =
        latest ? latest.evento : 'Sin compras confirmadas';
      document.getElementById('purchaseCount').textContent = `${reservations.length} reserva(s)`;
      status.textContent = confirmed.length
        ? 'Los códigos de las entradas confirmadas identifican tus compras. Los pagos de este sitio son simulados y no generan cargos.'
        : reservations.length
          ? 'No tienes entradas compradas. Las reservas pendientes de versiones anteriores no se consideran compras.'
          : 'No tienes entradas compradas.';
      applyFilters();
    })
    .catch(error => {
      status.textContent = error.message;
      console.error('No se pudo cargar el historial de reservas.', error);
    });
})();
