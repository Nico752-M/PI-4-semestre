(function () {
  const rows = document.querySelector('[data-agent-events]');
  const status = document.querySelector('[data-agent-events-status]');
  const cityFilter = document.querySelector('[data-event-city]');
  const search = document.querySelector('[data-event-search]');
  const currency = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
  const date = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota'
  });
  let events = [];
  rows.replaceChildren();

  function renderEvent(event) {
    const row = document.createElement('tr');
    const eventCell = document.createElement('td');
    const details = document.createElement('div');
    details.className = 'event-cell';
    const icon = document.createElement('div');
    icon.className = 'event-icon';
    icon.textContent = '✦';
    const titleArea = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = event.nombre;
    const location = document.createElement('small');
    location.textContent = `${event.ciudad} · ${event.departamento}`;
    titleArea.append(title, location);
    details.append(icon, titleArea);
    eventCell.append(details);

    const dateCell = document.createElement('td');
    dateCell.textContent = date.format(new Date(`${event.fecha_inicio}-05:00`));
    const capacityCell = document.createElement('td');
    capacityCell.textContent = String(event.capacidad);
    const priceCell = document.createElement('td');
    priceCell.textContent = Number(event.precio) === 0 ? 'Gratis' : currency.format(event.precio);
    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'status published';
    badge.textContent = 'PUBLICADO';
    statusCell.append(badge);
    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';
    const link = document.createElement('a');
    link.href = `../eventos/detalle.html?id=${encodeURIComponent(event.id)}`;
    link.textContent = 'Ver';
    actions.append(link);
    actionsCell.append(actions);
    row.append(eventCell, dateCell, capacityCell, priceCell, statusCell, actionsCell);
    return row;
  }

  function filterEvents() {
    const query = search.value.trim().toLocaleLowerCase('es-CO');
    const city = cityFilter.value;
    const filtered = events.filter(event =>
      (!city || event.ciudad === city) &&
      (!query || event.nombre.toLocaleLowerCase('es-CO').includes(query))
    );
    rows.replaceChildren(...filtered.map(renderEvent));
    document.querySelector('[data-event-count]').textContent = `· ${filtered.length} registros`;
    document.querySelector('[data-event-footer]').textContent = `${filtered.length} evento(s)`;
    document.querySelector('[data-agent-events-empty]').hidden = filtered.length > 0;
    if (!events.length) {
      document.querySelector('[data-agent-events-empty]').textContent = 'No has publicado eventos todavía.';
    } else if (!filtered.length) {
      document.querySelector('[data-agent-events-empty]').textContent = 'No hay eventos que coincidan con esos filtros.';
    }
  }

  Promise.all([
    window.EventStageApi.request('/auth/me'),
    window.EventStageApi.request('/agente/eventos')
  ]).then(([{ user }, result]) => {
    if (user.rol !== 'agente') {
      status.textContent = 'Esta página solo está disponible para agentes.';
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
    events = result;
    const cities = [...new Set(events.map(event => event.ciudad))].sort((a, b) => a.localeCompare(b));
    cities.forEach(city => cityFilter.add(new Option(city, city)));
    const now = Date.now();
    const finished = events.filter(event => new Date(`${event.fecha_fin}-05:00`).getTime() < now).length;
    document.querySelector('[data-total-events]').textContent = String(events.length);
    document.querySelector('[data-published-events]').textContent = String(events.length - finished);
    document.querySelector('[data-total-capacity]').textContent =
      String(events.reduce((total, event) => total + Number(event.capacidad), 0));
    document.querySelector('[data-finished-events]').textContent = String(finished);
    filterEvents();
    status.textContent = '';
  }).catch(error => {
    status.textContent = error.message;
    if (error.message === 'Inicia sesión para continuar.') {
      const link = document.createElement('a');
      link.href = `../clientes/login.html?returnUrl=${encodeURIComponent(location.href)}`;
      link.textContent = ' Inicia sesión para consultar tus eventos.';
      status.append(link);
    }
  });
  search.addEventListener('input', filterEvents);
  cityFilter.addEventListener('change', filterEvents);
})();
