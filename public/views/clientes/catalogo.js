(function () {
  const grid = document.querySelector('[data-events-grid]');
  const featured = document.querySelector('[data-featured-events]');
  const upcoming = document.querySelector('[data-upcoming-events]');
  const status = document.getElementById('events-status');
  const searchForm = document.getElementById('event-search');
  const citySelect = searchForm.elements.namedItem('ciudad');
  const cover = '../../assets/img/eventos/conciertos.svg';
  const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota'
  });
  const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
  let cityOptionsLoaded = false;

  function eventDate(value) {
    return dateFormatter.format(new Date(`${value}-05:00`));
  }

  function eventLink(event) {
    const link = document.createElement('a');
    link.href = `../eventos/detalle.html?id=${encodeURIComponent(event.id)}`;
    link.className = 'btn btn-small btn-outline';
    link.textContent = 'Ver evento →';
    return link;
  }

  function renderEventCard(event) {
    const card = document.createElement('article');
    card.className = 'event-card';
    const image = document.createElement('div');
    image.className = 'event-photo photo-blue';
    image.setAttribute('aria-hidden', 'true');
    const illustration = document.createElement('img');
    illustration.className = 'event-art';
    illustration.src = cover;
    illustration.alt = '';
    illustration.loading = 'lazy';
    const badge = document.createElement('span');
    badge.textContent = 'EVENTSTAGE';
    image.append(illustration, badge);

    const body = document.createElement('div');
    body.className = 'event-card-body';
    const title = document.createElement('h3');
    title.textContent = event.nombre;
    const location = document.createElement('p');
    location.textContent = `${event.ciudad} · ${event.departamento}`;
    const date = document.createElement('p');
    date.textContent = eventDate(event.fecha_inicio);
    const footer = document.createElement('div');
    footer.className = 'event-card-footer';
    const price = document.createElement('strong');
    price.textContent = Number(event.precio) === 0 ? 'Gratis' : currencyFormatter.format(event.precio);
    const link = eventLink(event);
    link.className = 'btn btn-pink';
    link.setAttribute('aria-label', `Ver boletas para ${event.nombre}`);
    footer.append(price, link);
    body.append(title, location, date, footer);
    card.append(image, body);
    return card;
  }

  function renderFeaturedCard(event) {
    const card = document.createElement('article');
    card.className = 'featured-card';
    const image = document.createElement('div');
    image.className = 'event-image image-yellow';
    image.setAttribute('aria-hidden', 'true');
    const illustration = document.createElement('img');
    illustration.className = 'event-art';
    illustration.src = cover;
    illustration.alt = '';
    illustration.loading = 'lazy';
    const badge = document.createElement('span');
    badge.textContent = 'EVENTSTAGE';
    image.append(illustration, badge);
    const body = document.createElement('div');
    body.className = 'featured-body';
    const title = document.createElement('h3');
    title.textContent = event.nombre;
    const details = document.createElement('p');
    details.textContent = `${eventDate(event.fecha_inicio)} · ${event.ciudad}`;
    body.append(title, details, eventLink(event));
    card.append(image, body);
    return card;
  }

  function renderUpcoming(event) {
    const row = document.createElement('article');
    row.className = 'upcoming-row';
    const date = new Date(`${event.fecha_inicio}-05:00`);
    const dateBox = document.createElement('div');
    dateBox.className = 'date-box';
    const day = document.createElement('strong');
    day.textContent = new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      timeZone: 'America/Bogota'
    }).format(date);
    const month = document.createElement('span');
    month.textContent = new Intl.DateTimeFormat('es-CO', {
      month: 'short',
      timeZone: 'America/Bogota'
    }).format(date);
    dateBox.append(day, month);
    const info = document.createElement('div');
    info.className = 'upcoming-info';
    const title = document.createElement('h3');
    title.textContent = event.nombre;
    const city = document.createElement('p');
    city.textContent = `${event.ciudad} · ${event.departamento}`;
    info.append(title, city);
    row.append(dateBox, info, eventLink(event));
    return row;
  }

  async function loadEvents() {
    status.textContent = 'Cargando eventos...';
    grid.replaceChildren();
    featured.replaceChildren();
    upcoming.replaceChildren();
    try {
      const parameters = new URLSearchParams();
      const query = searchForm.elements.namedItem('evento').value.trim();
      const city = citySelect.value.trim();
      if (query) parameters.set('q', query);
      if (city) parameters.set('ciudad', city);
      const suffix = parameters.size ? `?${parameters.toString()}` : '';
      const events = await window.EventStageApi.request(`/eventos${suffix}`);
      const selectedCity = citySelect.value;
      if (!cityOptionsLoaded) {
        const cities = [...new Set(events.map(event => event.ciudad))].sort((a, b) => a.localeCompare(b));
        citySelect.replaceChildren(new Option('Todas las ciudades', ''));
        cities.forEach(name => citySelect.add(new Option(name, name)));
        citySelect.value = cities.includes(selectedCity) ? selectedCity : '';
        cityOptionsLoaded = true;
      }

      events.forEach(event => {
        grid.append(renderEventCard(event));
      });
      events.slice(0, 4).forEach(event => featured.append(renderFeaturedCard(event)));
      events.slice(0, 5).forEach(event => upcoming.append(renderUpcoming(event)));
      status.textContent = events.length ? `${events.length} evento(s) encontrado(s).` : 'No hay eventos disponibles con esos filtros.';
    } catch (error) {
      status.textContent = error.message;
      console.error('No se pudieron cargar los eventos.', error);
    }
  }

  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    loadEvents();
  });
  loadEvents();
})();
