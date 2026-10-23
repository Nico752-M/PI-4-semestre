(function () {
  const host = document.querySelector('.content-body, .workspace-content');
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function metric(label, value, detail) {
    const card = element('article', undefined, 'workspace-card metric');
    card.append(element('span', label), element('strong', String(value)), element('small', detail));
    return card;
  }

  host.className = 'workspace-content';
  host.replaceChildren(
    element('div', undefined, 'workspace-heading'),
    status
  );
  const heading = host.querySelector('.workspace-heading');
  const headingCopy = element('div');
  headingCopy.append(
    element('span', 'ACTIVIDAD REGISTRADA', 'workspace-eyebrow'),
    element('h1', 'Resumen de eventos y reservas'),
    element('p', 'Datos consultados directamente desde la base de datos. El esquema no almacena pagos ni check-ins.')
  );
  heading.append(headingCopy);

  Promise.all([
    window.EventStageApi.request('/auth/me'),
    window.EventStageApi.request('/agente/eventos'),
    window.EventStageApi.request('/reservas/agente')
  ]).then(([{ user }, events, reservations]) => {
    if (user.rol !== 'agente') throw new Error('Esta página solo está disponible para agentes.');
    const profileName = [
      user.primerNombre,
      user.segundoNombre,
      user.primerApellido,
      user.segundoApellido
    ].filter(Boolean).join(' ');
    const profile = document.querySelector('.profile-card');
    if (profile) {
      profile.querySelector('strong').textContent = profileName;
      profile.querySelector('.avatar').textContent = profileName.split(/\s+/).slice(0, 2)
        .map(part => part[0]).join('').toUpperCase();
    }
    const counts = {
      pendientes: reservations.filter(item => item.estado === 'PENDIENTE').length,
      confirmadas: reservations.filter(item => item.estado === 'CONFIRMADA').length,
      canceladas: reservations.filter(item => item.estado === 'CANCELADA').length
    };
    const metrics = element('div', undefined, 'workspace-metrics');
    metrics.append(
      metric('Eventos', events.length, 'Eventos asociados a tu cuenta'),
      metric('Reservas / entradas', reservations.length, 'Cada reserva representa una entrada'),
      metric('Pendientes', counts.pendientes, 'Estado PENDIENTE'),
      metric('Confirmadas', counts.confirmadas, 'Estado CONFIRMADA')
    );

    const card = element('section', undefined, 'workspace-card');
    const title = element('div', undefined, 'workspace-card-heading');
    title.append(element('h2', 'Capacidad y reservas por evento'));
    const tableWrap = element('div', undefined, 'workspace-table-wrap');
    const table = element('table', undefined, 'workspace-table');
    const head = element('thead');
    const headerRow = element('tr');
    ['Evento', 'Fecha', 'Capacidad', 'Reservas activas', 'Disponibles'].forEach(label => {
      headerRow.append(element('th', label));
    });
    head.append(headerRow);
    const body = element('tbody');
    events.forEach(event => {
      const row = element('tr');
      const activeReservations = Number(event.capacidad) - Number(event.disponibles);
      const startDate = new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeZone: 'America/Bogota'
      }).format(new Date(`${event.fecha_inicio}-05:00`));
      [
        event.nombre,
        startDate,
        event.capacidad,
        activeReservations,
        event.disponibles
      ].forEach(value => row.append(element('td', String(value))));
      body.append(row);
    });
    if (!events.length) {
      const row = element('tr');
      row.append(element('td', 'Todavía no has creado eventos.'));
      body.append(row);
    }
    table.append(head, body);
    tableWrap.append(table);
    card.append(title, tableWrap);
    host.append(metrics, card);
    status.textContent = counts.canceladas
      ? `${counts.canceladas} reserva(s) cancelada(s) excluidas del conteo de disponibilidad.`
      : '';
  }).catch(error => {
    status.textContent = error.message;
    console.error('No se pudo cargar el resumen de eventos.', error);
  });
})();
