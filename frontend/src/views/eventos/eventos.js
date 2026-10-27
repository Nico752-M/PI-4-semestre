(function () {
  const cover = '../../assets/img/eventos/conciertos.svg';
  const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota'
  });
  const timeFormatter = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Bogota'
  });

  window.EVENTOS_READY = window.EventStageApi.request('/eventos').then(rows => {
    const events = Object.fromEntries(rows.map(row => {
      const startsAt = new Date(`${row.fecha_inicio}-05:00`);
      return [String(row.id), {
        id: row.id,
        nombre: row.nombre,
        categoria: 'Evento',
        fecha: dateFormatter.format(startsAt),
        hora: timeFormatter.format(startsAt),
        lugar: `${row.ciudad}, ${row.departamento}`,
        ciudad: row.ciudad,
        direccion: `${row.departamento}, ${row.pais} · Capacidad: ${row.capacidad}`,
        disponibles: Number(row.disponibles),
        descripcion: row.descripcion || 'El organizador no agregó una descripción.',
        portada: cover,
        galeria: [{ src: cover, alt: `Ilustración genérica para ${row.nombre}` }],
        localidades: [{
          nombre: 'Entrada',
          detalle: `Precio único · ${row.disponibles} disponibles`,
          precio: Number(row.precio)
        }],
        fechaInicio: row.fecha_inicio,
        fechaFin: row.fecha_fin
      }];
    }));
    window.EVENTOS = events;
    return events;
  });
})();
