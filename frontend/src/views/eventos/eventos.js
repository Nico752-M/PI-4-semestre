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
        descripcion: row.descripcion || 'Consulta los detalles de este evento.',
        portada: cover,
        galeria: [{ src: cover, alt: `Imagen de ${row.nombre}` }],
        localidades: [{
          nombre: 'Entrada general',
          detalle: `${row.disponibles} entradas disponibles`,
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
