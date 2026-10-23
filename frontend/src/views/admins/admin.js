(function () {
  const page = document.body.dataset.adminView;
  const status = document.querySelector('[data-admin-status-message]');

  function addCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value || '—';
    row.append(cell);
    return cell;
  }

  function fullName(person) {
    return [
      person.primerNombre,
      person.segundoNombre,
      person.primerApellido,
      person.segundoApellido
    ].filter(Boolean).join(' ');
  }

  function addPersonCell(row, person, email) {
    const cell = document.createElement('td');
    const name = fullName(person);
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-person';
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    const identity = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = name;
    const small = document.createElement('small');
    small.textContent = email || person.correo;
    identity.append(strong, small);
    wrapper.append(avatar, identity);
    cell.append(wrapper);
    row.append(cell);
  }

  function renderEvent(row, event) {
    const eventCell = document.createElement('td');
    row.append(eventCell);
    const title = document.createElement('strong');
    title.textContent = event.nombre;
    const location = document.createElement('small');
    location.textContent = `${event.ciudad} · ${event.departamento}`;
    eventCell.append(title, location);
    addCell(row, event.agente);
    addCell(row, new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeZone: 'America/Bogota'
    }).format(new Date(`${event.fecha_inicio}-05:00`)));
    const state = Date.now() < new Date(`${event.fecha_inicio}-05:00`).getTime()
      ? 'Próximo'
      : Date.now() <= new Date(`${event.fecha_fin}-05:00`).getTime()
        ? 'En curso'
        : 'Finalizado';
    const stateCell = addCell(row, state);
    row.dataset.status = state.toLocaleLowerCase('es');
    const actionsCell = document.createElement('td');
    const editLink = document.createElement('a');
    editLink.className = 'workspace-button';
    editLink.href = `../agentes/crear-evento.html?editar=${encodeURIComponent(event.id)}&origen=admin`;
    editLink.textContent = 'Editar';
    actionsCell.append(editLink);
    row.append(actionsCell);
  }

  async function loadAdminPage() {
    if (!page) return;
    try {
      const { user } = await window.EventStageApi.request('/auth/me');
      if (user.rol !== 'administrador') {
        throw new Error('Esta página solo está disponible para administradores.');
      }
      const summary = await window.EventStageApi.request('/admin/resumen');
      const accountName = fullName(user);
      const profile = document.querySelector('.profile-card');
      if (profile) {
        profile.querySelector('strong').textContent = accountName;
        profile.querySelector('.avatar').textContent = accountName.split(/\s+/).slice(0, 2)
          .map(part => part[0]).join('').toUpperCase();
      }

      if (page === 'dashboard') {
        const values = {
          eventos: summary.eventos,
          agentes: summary.agentes,
          clientes: summary.clientes,
          reservas: summary.reservas
        };
        document.querySelectorAll('[data-admin-metric]').forEach(element => {
          element.textContent = String(values[element.dataset.adminMetric] ?? 0);
        });
        document.querySelectorAll('[data-admin-reservation-count]').forEach(element => {
          element.textContent = `${summary.pendientes} pendientes · ${summary.confirmadas} confirmadas`;
        });
        return;
      }
      if (page === 'reportes') {
        const values = {
          eventos: summary.eventos,
          agentes: summary.agentes,
          clientes: summary.clientes,
          reservas: summary.reservas
        };
        document.querySelectorAll('[data-admin-metric]').forEach(element => {
          element.textContent = String(values[element.dataset.adminMetric] ?? 0);
        });
        return;
      }

      const endpoints = {
        eventos: '/admin/eventos',
        agentes: '/admin/agentes',
        usuarios: '/admin/usuarios'
      };
      const result = await window.EventStageApi.request(endpoints[page]);
      const body = document.querySelector('[data-admin-rows]');
      if (!body) return;
      const fragment = document.createDocumentFragment();
      result.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.adminRow = '';
        if (page === 'eventos') {
          renderEvent(row, item);
        } else {
          addPersonCell(row, item);
          if (page === 'agentes') {
            addCell(row, String(item.eventos));
            addCell(row, item.codigoAgente);
          } else {
            addCell(row, `${item.ciudad}, ${item.departamento}`);
            addCell(row, String(item.reservas));
          }
          const role = document.createElement('td');
          const badge = document.createElement('span');
          badge.className = 'workspace-badge success';
          badge.textContent = page === 'agentes' ? 'Agente registrado' : 'Cliente registrado';
          role.append(badge);
          row.append(role);
        }
        fragment.append(row);
      });
      body.replaceChildren(fragment);
      filterTable(body.closest('[data-admin-table]'));
      document.querySelectorAll('[data-admin-total]').forEach(element => {
        element.textContent = `${result.length} registro(s)`;
      });
      if (status) {
        const updatedEvent = new URLSearchParams(location.search).get('actualizado');
        status.textContent = updatedEvent && page === 'eventos'
          ? 'Los cambios del evento se guardaron correctamente.'
          : result.length ? '' : 'No hay registros en la base de datos.';
      }
    } catch (error) {
      if (error.status === 401) {
        const returnUrl = encodeURIComponent(location.href);
        location.replace(`/views/admins/login.html?returnUrl=${returnUrl}`);
        return;
      }
      if (status) status.textContent = error.message;
      console.error('No se pudo cargar la información administrativa.', error);
    }
  }

  function filterTable(card) {
    const search = (card.querySelector('[data-admin-search]')?.value || '').trim().toLocaleLowerCase('es');
    const status = card.querySelector('[data-admin-status]')?.value || '';
    const rows = card.querySelectorAll('[data-admin-row]');

    rows.forEach(row => {
      const matchesSearch = row.textContent.toLocaleLowerCase('es').includes(search);
      const matchesStatus = !status || row.dataset.status === status;
      row.hidden = !matchesSearch || !matchesStatus;
    });
  }

  document.querySelectorAll('[data-admin-table]').forEach(card => {
    card.querySelectorAll('[data-admin-search], [data-admin-status]').forEach(control => {
      control.addEventListener('input', () => filterTable(card));
      control.addEventListener('change', () => filterTable(card));
    });
  });
  loadAdminPage();
})();
