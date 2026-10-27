(function () {
  const status = document.querySelector('[data-agent-dashboard-status]');

  function setAccount(user) {
    const name = [
      user.primerNombre,
      user.segundoNombre,
      user.primerApellido,
      user.segundoApellido
    ].filter(Boolean).join(' ');
    const profile = document.querySelector('.profile-card');
    if (profile) {
      profile.querySelector('strong').textContent = name;
      profile.querySelector('.avatar').textContent = name.split(/\s+/).slice(0, 2)
        .map(part => part[0]).join('').toUpperCase();
    }
  }

  function renderEvent(event) {
    const item = document.createElement('article');
    const icon = document.createElement('span');
    icon.className = 'workspace-event-icon';
    icon.textContent = '✦';
    const details = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = event.nombre;
    const location = document.createElement('small');
    location.textContent = `${event.ciudad} · ${event.departamento}`;
    details.append(title, location);
    const available = document.createElement('b');
    available.textContent = `${event.disponibles} disponibles`;
    item.append(icon, details, available);
    return item;
  }

  Promise.all([
    window.EventStageApi.request('/auth/me'),
    window.EventStageApi.request('/agente/eventos'),
    window.EventStageApi.request('/reservas/agente')
  ]).then(([{ user }, events, reservations]) => {
    if (user.rol !== 'agente') throw new Error('Esta página solo está disponible para agentes.');
    setAccount(user);
    const upcoming = events.filter(event =>
      new Date(`${event.fecha_fin}-05:00`).getTime() >= Date.now()
    );
    const pending = reservations.filter(item => item.estado === 'PENDIENTE').length;
    const totals = {
      eventos: events.length,
      reservas: reservations.length,
      pendientes: pending,
      disponibles: events.reduce((total, event) => total + Number(event.disponibles), 0)
    };
    document.querySelectorAll('[data-agent-metric]').forEach(element => {
      element.textContent = String(totals[element.dataset.agentMetric] ?? 0);
    });
    const list = document.querySelector('[data-agent-upcoming]');
    list.replaceChildren(...upcoming.slice(0, 3).map(renderEvent));
    if (!upcoming.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No tienes eventos próximos.';
      list.append(empty);
    }
    status.textContent = '';
  }).catch(error => {
    status.textContent = error.message;
    console.error('No se pudo cargar el resumen del agente.', error);
  });
})();
