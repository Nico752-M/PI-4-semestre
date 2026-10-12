(function () {
  const events = window.EVENTOS || {};
  const event = events[new URLSearchParams(window.location.search).get('id')];
  const content = document.getElementById('event-content');
  const notFound = document.getElementById('event-not-found');

  if (!event) {
    notFound.hidden = false;
    document.title = 'Evento no encontrado | EventStage';
    return;
  }

  content.hidden = false;
  document.title = `${event.nombre} | EventStage`;
  document.getElementById('event-breadcrumb-name').textContent = event.nombre;
  document.getElementById('event-category').textContent = event.categoria;
  document.getElementById('event-title').textContent = event.nombre;
  document.getElementById('event-meta').textContent = `${event.lugar} · ${event.ciudad} · ${event.fecha}`;
  document.getElementById('event-time').textContent = event.hora;
  document.getElementById('event-description').textContent = event.descripcion;
  const cover = document.getElementById('event-cover');
  cover.src = event.portada;
  cover.alt = `Imagen de ${event.nombre}`;

  const gallery = document.getElementById('event-gallery');
  event.galeria.forEach((image, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'event-gallery-item';
    button.setAttribute('aria-label', `Mostrar imagen ${index + 1}: ${image.alt}`);
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');

    const thumbnail = document.createElement('img');
    thumbnail.src = image.src;
    thumbnail.alt = image.alt;
    thumbnail.loading = 'lazy';
    button.append(thumbnail);
    button.addEventListener('click', () => {
      cover.src = image.src;
      cover.alt = image.alt;
      gallery.querySelectorAll('.event-gallery-item').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
    });
    gallery.append(button);
  });

  const ticketOptions = document.getElementById('ticket-options');
  event.localidades.forEach((localidad, index) => {
    const label = document.createElement('label');
    label.className = 'ticket-option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'localidad';
    radio.value = String(index);
    radio.checked = index === 0;

    const details = document.createElement('span');
    details.className = 'ticket-option-details';
    const name = document.createElement('strong');
    name.textContent = localidad.nombre;
    const description = document.createElement('small');
    description.textContent = localidad.detalle;
    details.append(name, description);

    const price = document.createElement('strong');
    price.className = 'ticket-option-price';
    price.textContent = formatPrice(localidad.precio);
    label.append(radio, details, price);
    ticketOptions.append(label);
  });

  const quantityInput = document.getElementById('ticket-quantity');
  const subtotal = document.getElementById('ticket-subtotal');
  const message = document.getElementById('ticket-message');
  const form = document.getElementById('ticket-form');

  function getQuantity() {
    const quantity = Number.parseInt(quantityInput.value, 10);
    return Number.isNaN(quantity) ? 1 : Math.max(1, Math.min(6, quantity));
  }

  function updateSubtotal() {
    const selected = ticketOptions.querySelector('input[name="localidad"]:checked');
    const localidad = event.localidades[Number(selected.value)];
    quantityInput.value = String(getQuantity());
    subtotal.textContent = formatPrice(localidad.precio * getQuantity());
    message.textContent = 'La compra y el pago estarán disponibles cuando se conecte la pasarela de pagos.';
  }

  ticketOptions.addEventListener('change', updateSubtotal);
  quantityInput.addEventListener('input', updateSubtotal);
  quantityInput.addEventListener('blur', updateSubtotal);
  document.getElementById('quantity-decrease').addEventListener('click', () => {
    quantityInput.value = String(getQuantity() - 1);
    updateSubtotal();
  });
  document.getElementById('quantity-increase').addEventListener('click', () => {
    quantityInput.value = String(getQuantity() + 1);
    updateSubtotal();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    message.textContent = 'Tus boletas están seleccionadas, pero aún no podemos procesar el pago. La pasarela de pagos no está conectada.';
  });

  updateSubtotal();

  const related = document.getElementById('related-events');
  Object.entries(events)
    .filter(([id]) => id !== new URLSearchParams(window.location.search).get('id'))
    .slice(0, 4)
    .forEach(([id, relatedEvent]) => {
      const card = document.createElement('a');
      card.className = 'related-event-card';
      card.href = `detalle.html?id=${encodeURIComponent(id)}`;

      const image = document.createElement('img');
      image.src = relatedEvent.portada;
      image.alt = '';
      image.loading = 'lazy';
      const info = document.createElement('span');
      info.className = 'related-event-info';
      const title = document.createElement('strong');
      title.textContent = relatedEvent.nombre;
      const meta = document.createElement('small');
      meta.textContent = `${relatedEvent.fecha} · ${relatedEvent.ciudad}`;
      info.append(title, meta);
      card.append(image, info);
      related.append(card);
    });

  function formatPrice(value) {
    return value === 0 ? 'Gratis' : new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value);
  }
})();
