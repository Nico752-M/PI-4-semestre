(async function () {
  const content = document.getElementById('event-content');
  const notFound = document.getElementById('event-not-found');
  const message = document.getElementById('ticket-message');
  let events;
  try {
    events = await window.EVENTOS_READY;
  } catch (error) {
    notFound.hidden = false;
    notFound.querySelector('p:last-of-type').textContent = error.message;
    document.title = 'Error al cargar el evento | EventStage';
    return;
  }

  const eventId = new URLSearchParams(window.location.search).get('id');
  const event = events[eventId];

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
  document.getElementById('event-meta').textContent = `${event.ciudad}, ${event.departamento} · ${event.fecha}`;
  document.getElementById('event-time').textContent = event.hora;
  document.getElementById('event-description').textContent = event.descripcion;
  const cover = document.getElementById('event-cover');
  cover.src = event.portada;
  cover.alt = `Ilustración genérica para ${event.nombre}`;

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
  const form = document.getElementById('ticket-form');
  const paymentDialog = document.getElementById('payment-dialog');
  const paymentForm = document.getElementById('payment-form');
  const paymentStatus = document.getElementById('payment-status');
  const paymentCardFields = document.getElementById('payment-card-fields');
  const paymentSubmit = paymentForm.querySelector('[type="submit"]');
  const paymentCompleteLink = document.querySelector('.payment-complete-link');

  function getQuantity() {
    const quantity = Number.parseInt(quantityInput.value, 10);
    return Number.isNaN(quantity) ? 1 : Math.max(1, Math.min(6, quantity));
  }

  function selectedPrice() {
    const selected = ticketOptions.querySelector('input[name="localidad"]:checked');
    return selected ? event.localidades[Number(selected.value)].precio : 0;
  }

  function updateSubtotal() {
    if (!ticketOptions.querySelector('input[name="localidad"]:checked')) return;
    quantityInput.value = String(getQuantity());
    subtotal.textContent = formatPrice(selectedPrice() * getQuantity());
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
  form.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    message.textContent = 'Verificando tu cuenta...';
    try {
      const { user } = await window.EventStageApi.request('/auth/me');
      if (user.rol !== 'cliente') {
        throw new Error('Solo los clientes pueden comprar entradas.');
      }
      document.getElementById('payment-event-name').textContent =
        `${event.nombre} · ${getQuantity()} entrada(s)`;
      document.getElementById('payment-total').textContent =
        formatPrice(selectedPrice() * getQuantity());
      paymentStatus.textContent = '';
      paymentSubmit.hidden = false;
      paymentSubmit.disabled = false;
      paymentCompleteLink.hidden = true;
      paymentCardFields.hidden = selectedPrice() === 0;
      paymentCardFields.querySelectorAll('input').forEach(input => {
        input.required = selectedPrice() !== 0;
        input.value = '';
      });
      paymentForm.reset();
      paymentCardFields.hidden = selectedPrice() === 0;
      paymentDialog.showModal();
      message.textContent = '';
    } catch (error) {
      message.textContent = error.message;
      if (error.status === 401) {
        const link = document.createElement('a');
        link.href = `../clientes/login.html?returnUrl=${encodeURIComponent(location.href)}`;
        link.textContent = ' Inicia sesión para continuar.';
        message.append(link);
      }
    } finally {
      submit.disabled = false;
    }
  });

  paymentDialog.querySelectorAll('[data-payment-close]').forEach(button => {
    button.addEventListener('click', () => paymentDialog.close());
  });

  paymentForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    if (!paymentForm.reportValidity()) return;
    paymentSubmit.disabled = true;
    paymentStatus.textContent = 'Procesando pago de prueba...';
    try {
      const result = await window.EventStageApi.request('/compras/simular', {
        method: 'POST',
        body: {
          idEvento: eventId,
          cantidad: getQuantity(),
          precioEsperado: selectedPrice()
        }
      });
      const ticketNumbers = result.entradas.map(ticket => `#${ticket.id}`).join(', ');
      paymentStatus.textContent =
        `Pago de prueba aprobado por ${formatPrice(result.total)}. Tus entradas están confirmadas: ${ticketNumbers}. No se realizó ningún cargo.`;
      paymentCardFields.hidden = true;
      paymentSubmit.hidden = true;
      paymentCompleteLink.hidden = false;
      paymentForm.querySelectorAll('input').forEach(input => {
        input.required = false;
        input.value = '';
      });
      message.textContent = `Compra simulada confirmada. Entradas: ${ticketNumbers}.`;
      const available = Math.max(0, event.disponibles - getQuantity());
      event.disponibles = available;
      event.localidades[0].detalle = `Precio único · ${available} disponibles`;
      ticketOptions.querySelector('.ticket-option-details small').textContent =
        event.localidades[0].detalle;
    } catch (error) {
      paymentStatus.textContent = error.message;
      paymentSubmit.disabled = false;
      if (error.status === 401) {
        const link = document.createElement('a');
        link.href = `../clientes/login.html?returnUrl=${encodeURIComponent(location.href)}`;
        link.textContent = ' Inicia sesión y vuelve para comprar.';
        paymentStatus.append(link);
      }
    }
  });

  updateSubtotal();

  const related = document.getElementById('related-events');
  Object.entries(events)
    .filter(([id]) => id !== eventId)
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
