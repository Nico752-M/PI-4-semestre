const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_DURATION_SECONDS = 60 * 60 * 24;
const REMEMBERED_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const frontendOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5500')
  .split(',')
  .map(origin => origin.trim());

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error('Configura SESSION_SECRET con al menos 32 caracteres en .env.');
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origen no permitido por la configuración CORS.'));
  },
  credentials: true
}));
app.use(express.json({ limit: '32kb' }));

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requiredText(value, label, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new ApiError(400, `${label} es obligatorio y admite hasta ${maxLength} caracteres.`);
  }
  return value.trim();
}

function requiredPassword(value) {
  if (typeof value !== 'string' || !value || value.length > 128) {
    throw new ApiError(400, 'La contraseña es obligatoria y admite hasta 128 caracteres.');
  }
  if (value.length < 8) {
    throw new ApiError(400, 'La contraseña debe tener al menos 8 caracteres.');
  }
  return value;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new ApiError(400, `${label} debe ser un número entero mayor que cero.`);
  }
  return number;
}

function sessionToken(personId, durationSeconds) {
  const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;
  const payload = `${personId}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function setSessionCookie(res, token, durationSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `eventstage_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${durationSeconds}${secure}`
  );
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `eventstage_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

function readSessionToken(req) {
  const cookie = req.headers.cookie
    ?.split(';')
    .map(value => value.trim())
    .find(value => value.startsWith('eventstage_session='));
  if (!cookie) return null;

  const token = cookie.slice('eventstage_session='.length);
  const [personIdText, expiresAtText, signature] = token.split('.');
  const personId = Number(personIdText);
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(personId) || personId <= 0 ||
      !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000) ||
      !signature) {
    return null;
  }

  const payload = `${personId}.${expiresAt}`;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest();
  let received;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  return received.length === expected.length && crypto.timingSafeEqual(received, expected)
    ? { token, personId }
    : null;
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(personId, res, remember = false) {
  const durationSeconds = remember
    ? REMEMBERED_SESSION_DURATION_SECONDS
    : SESSION_DURATION_SECONDS;
  const token = sessionToken(personId, durationSeconds);
  const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;
  await db.query('DELETE FROM sesion WHERE expira_en <= CURRENT_TIMESTAMP');
  await db.query(
    'INSERT INTO sesion (token_hash, id_persona, expira_en) VALUES ($1, $2, $3)',
    [hashSessionToken(token), personId, new Date(expiresAt * 1000)]
  );
  setSessionCookie(res, token, durationSeconds);
}

async function authenticate(req, res, next) {
  const session = readSessionToken(req);
  if (!session) {
    res.status(401).json({ error: 'Inicia sesión para continuar.' });
    return;
  }

  try {
    const result = await db.query(
      `SELECT p.id_persona AS "idPersona",
              p.primer_nombre AS "primerNombre",
             p.segundo_nombre AS "segundoNombre",
             p.primer_apellido AS "primerApellido",
             p.segundo_apellido AS "segundoApellido",
             p.correo,
             p.telefono,
             p.num_identificacion AS identificacion,
             ag.codigo_agente AS "codigoAgente",
             ci.nombre AS ciudad,
             d.nombre AS departamento,
             pa.nombre AS pais,
             CASE
               WHEN ag.id_agente IS NOT NULL THEN 'agente'
               WHEN cl.id_cliente IS NOT NULL THEN 'cliente'
               WHEN ad.id_administrador IS NOT NULL THEN 'administrador'
             END AS rol
      FROM sesion s
      JOIN persona p ON p.id_persona = s.id_persona
      JOIN ciudad ci ON ci.id_ciudad = p.id_ciudad
      JOIN departamento d ON d.id_departamento = ci.id_departamento
      JOIN pais pa ON pa.id_pais = d.id_pais
       LEFT JOIN agente ag ON ag.id_agente = p.id_persona
       LEFT JOIN cliente cl ON cl.id_cliente = p.id_persona
       LEFT JOIN administrador ad ON ad.id_administrador = p.id_persona
       WHERE s.token_hash = $1
         AND s.id_persona = $2
         AND s.expira_en > CURRENT_TIMESTAMP`,
      [hashSessionToken(session.token), session.personId]
    );
    if (!result.rowCount || !result.rows[0].rol) {
      clearSessionCookie(res);
      res.status(401).json({ error: 'La sesión ya no es válida. Inicia sesión nuevamente.' });
      return;
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.rol !== role) {
      res.status(403).json({ error: 'Tu cuenta no tiene permiso para realizar esta acción.' });
      return;
    }
    next();
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(`scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, storedHash) {
  const [algorithm, saltHex, hashHex] = (storedHash || '').split('$');
  if (algorithm !== 'scrypt' || !/^[\da-f]{32}$/i.test(saltHex || '') ||
      !/^[\da-f]{128}$/i.test(hashHex || '')) {
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, Buffer.from(saltHex, 'hex'), 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(crypto.timingSafeEqual(derivedKey, Buffer.from(hashHex, 'hex')));
    });
  });
}

function publicUser(row) {
  return {
    idPersona: row.idPersona,
    primerNombre: row.primerNombre,
    segundoNombre: row.segundoNombre,
    primerApellido: row.primerApellido,
    segundoApellido: row.segundoApellido,
    correo: row.correo,
    telefono: row.telefono,
    identificacion: row.identificacion,
    codigoAgente: row.codigoAgente,
    ciudad: row.ciudad,
    departamento: row.departamento,
    pais: row.pais,
    rol: row.rol
  };
}

app.get('/api/health', async (req, res, next) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/paises', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id_pais AS id, nombre FROM pais ORDER BY nombre'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/departamentos', async (req, res, next) => {
  try {
    const countryId = positiveInteger(req.query.paisId, 'El país');
    const result = await db.query(
      'SELECT id_departamento AS id, nombre FROM departamento WHERE id_pais = $1 ORDER BY nombre',
      [countryId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/ciudades', async (req, res, next) => {
  try {
    const departmentId = positiveInteger(req.query.departamentoId, 'El departamento');
    const result = await db.query(
      'SELECT id_ciudad AS id, nombre FROM ciudad WHERE id_departamento = $1 ORDER BY nombre',
      [departmentId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

const eventSelect = `
  SELECT e.id_evento AS id,
         e.nombre,
         e.descripcion,
         to_char(e.fecha_inicio, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio,
         to_char(e.fecha_fin, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_fin,
         e.capacidad,
         GREATEST(
           e.capacidad - (
             SELECT count(*)::int
             FROM reserva r
             WHERE r.id_evento = e.id_evento
               AND upper(r.estado) <> 'CANCELADA'
           ),
           0
         ) AS disponibles,
         e.precio,
         e.id_ciudad AS "idCiudad",
         ci.nombre AS ciudad,
         d.nombre AS departamento,
         p.nombre AS pais,
         e.id_agente AS "idAgente"
  FROM evento e
  JOIN ciudad ci ON ci.id_ciudad = e.id_ciudad
  JOIN departamento d ON d.id_departamento = ci.id_departamento
  JOIN pais p ON p.id_pais = d.id_pais`;

app.get('/api/eventos', async (req, res, next) => {
  try {
    const conditions = [];
    const values = [];
    if (typeof req.query.ciudad === 'string' && req.query.ciudad.trim()) {
      values.push(req.query.ciudad.trim());
      conditions.push(`ci.nombre ILIKE $${values.length}`);
      values[values.length - 1] = `%${values[values.length - 1]}%`;
    }
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      values.push(`%${req.query.q.trim()}%`);
      conditions.push(`e.nombre ILIKE $${values.length}`);
    }
    const result = await db.query(
      `${eventSelect}
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY e.fecha_inicio`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/eventos/:id', async (req, res, next) => {
  try {
    const eventId = positiveInteger(req.params.id, 'El evento');
    const result = await db.query(`${eventSelect} WHERE e.id_evento = $1`, [eventId]);
    if (!result.rowCount) {
      res.status(404).json({ error: 'No encontramos ese evento.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/resumen', authenticate, requireRole('administrador'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         (SELECT count(*)::int FROM evento) AS eventos,
         (SELECT count(*)::int FROM agente) AS agentes,
         (SELECT count(*)::int FROM cliente) AS clientes,
         (SELECT count(*)::int FROM reserva) AS reservas,
         (SELECT count(*)::int FROM reserva WHERE upper(estado) = 'PENDIENTE') AS pendientes,
         (SELECT count(*)::int FROM reserva WHERE upper(estado) = 'CONFIRMADA') AS confirmadas`
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/usuarios', authenticate, requireRole('administrador'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.id_persona AS id,
              p.primer_nombre AS "primerNombre",
              p.segundo_nombre AS "segundoNombre",
              p.primer_apellido AS "primerApellido",
              p.segundo_apellido AS "segundoApellido",
              p.correo,
              p.telefono,
              ci.nombre AS ciudad,
              d.nombre AS departamento,
              count(r.id_reserva)::int AS reservas
       FROM cliente cl
       JOIN persona p ON p.id_persona = cl.id_cliente
       JOIN ciudad ci ON ci.id_ciudad = p.id_ciudad
       JOIN departamento d ON d.id_departamento = ci.id_departamento
       LEFT JOIN reserva r ON r.id_cliente = cl.id_cliente
       GROUP BY p.id_persona, ci.nombre, d.nombre
       ORDER BY p.primer_apellido, p.primer_nombre`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/agentes', authenticate, requireRole('administrador'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.id_persona AS id,
              p.primer_nombre AS "primerNombre",
              p.segundo_nombre AS "segundoNombre",
              p.primer_apellido AS "primerApellido",
              p.segundo_apellido AS "segundoApellido",
              p.correo,
              ag.codigo_agente AS "codigoAgente",
              count(e.id_evento)::int AS eventos
       FROM agente ag
       JOIN persona p ON p.id_persona = ag.id_agente
       LEFT JOIN evento e ON e.id_agente = ag.id_agente
       GROUP BY p.id_persona, ag.codigo_agente
       ORDER BY p.primer_apellido, p.primer_nombre`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/eventos', authenticate, requireRole('administrador'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT events.*,
              p.primer_nombre AS "primerNombreAgente",
              p.segundo_nombre AS "segundoNombreAgente",
              p.primer_apellido AS "primerApellidoAgente",
              p.segundo_apellido AS "segundoApellidoAgente",
              p.correo AS "correoAgente"
       FROM (${eventSelect}) events
       JOIN persona p ON p.id_persona = events."idAgente"
       ORDER BY events.fecha_inicio`
    );
    res.json(result.rows.map(row => ({
      ...row,
      agente: [
        row.primerNombreAgente,
        row.segundoNombreAgente,
        row.primerApellidoAgente,
        row.segundoApellidoAgente
      ].filter(Boolean).join(' '),
      correoAgente: row.correoAgente
    })));
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  let client;
  try {
    const body = req.body || {};
    const identification = requiredText(body.identificacion, 'La identificación', 20);
    const firstName = requiredText(body.primerNombre, 'El primer nombre', 50);
    const secondName = typeof body.segundoNombre === 'string' ? body.segundoNombre.trim() : '';
    const firstSurname = requiredText(body.primerApellido, 'El primer apellido', 50);
    const secondSurname = typeof body.segundoApellido === 'string' ? body.segundoApellido.trim() : '';
    const email = requiredText(body.correo, 'El correo', 100).toLowerCase();
    const phone = typeof body.telefono === 'string' ? body.telefono.trim() : '';
    const cityId = positiveInteger(body.idCiudad, 'La ciudad');
    const password = requiredPassword(body.password);
    const role = body.rol;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido.');
    }
    if (!['cliente', 'agente'].includes(role)) {
      throw new ApiError(400, 'Selecciona un tipo de cuenta válido.');
    }
    if (secondName.length > 50 || secondSurname.length > 50 || phone.length > 20) {
      throw new ApiError(400, 'Uno de los datos supera la longitud permitida.');
    }

    const passwordHash = await hashPassword(password);
    client = await db.connect();
    await client.query('BEGIN');
    const personResult = await client.query(
      `INSERT INTO persona
         (num_identificacion, primer_nombre, segundo_nombre, primer_apellido,
          segundo_apellido, telefono, correo, id_ciudad, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_persona AS "idPersona", primer_nombre AS "primerNombre",
                 primer_apellido AS "primerApellido", correo`,
      [
        identification, firstName, secondName || null, firstSurname,
        secondSurname || null, phone || null, email, cityId, passwordHash
      ]
    );
    const person = personResult.rows[0];
    if (role === 'cliente') {
      await client.query(
        'INSERT INTO cliente (id_cliente) VALUES ($1)',
        [person.idPersona]
      );
    } else {
      await client.query(
        'INSERT INTO agente (id_agente, codigo_agente) VALUES ($1, $2)',
        [person.idPersona, `AG-${crypto.randomBytes(6).toString('hex').toUpperCase()}`]
      );
    }
    await client.query('COMMIT');
    person.rol = role;
    await createSession(person.idPersona, res);
    res.status(201).json({ user: publicUser(person) });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(rollbackError => {
        console.error('No se pudo revertir la transacción de registro:', rollbackError);
      });
    }
    next(error);
  } finally {
    client?.release();
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const body = req.body || {};
    const email = requiredText(body.correo, 'El correo', 100).toLowerCase();
    const password = requiredPassword(body.password);
    const result = await db.query(
      `SELECT p.id_persona AS "idPersona",
              p.primer_nombre AS "primerNombre",
              p.segundo_nombre AS "segundoNombre",
              p.primer_apellido AS "primerApellido",
              p.segundo_apellido AS "segundoApellido",
              p.correo,
              p.telefono,
              p.num_identificacion AS identificacion,
              ag.codigo_agente AS "codigoAgente",
              ci.nombre AS ciudad,
              d.nombre AS departamento,
              pa.nombre AS pais,
              p.password_hash,
              CASE
                WHEN ag.id_agente IS NOT NULL THEN 'agente'
                WHEN cl.id_cliente IS NOT NULL THEN 'cliente'
                WHEN ad.id_administrador IS NOT NULL THEN 'administrador'
              END AS rol
       FROM persona p
       JOIN ciudad ci ON ci.id_ciudad = p.id_ciudad
       JOIN departamento d ON d.id_departamento = ci.id_departamento
       JOIN pais pa ON pa.id_pais = d.id_pais
       LEFT JOIN agente ag ON ag.id_agente = p.id_persona
       LEFT JOIN cliente cl ON cl.id_cliente = p.id_persona
       LEFT JOIN administrador ad ON ad.id_administrador = p.id_persona
       WHERE lower(p.correo) = $1`,
      [email]
    );
    const person = result.rows[0];
    if (!person || !person.rol || !await verifyPassword(password, person.password_hash)) {
      throw new ApiError(401, 'Correo o contraseña incorrectos.');
    }
    await createSession(person.idPersona, res, body.recordarme === true);
    res.json({ user: publicUser(person) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const cookie = req.headers.cookie
      ?.split(';')
      .map(value => value.trim())
      .find(value => value.startsWith('eventstage_session='));
    if (cookie) {
      const token = cookie.slice('eventstage_session='.length);
      await db.query('DELETE FROM sesion WHERE token_hash = $1', [hashSessionToken(token)]);
    }
    clearSessionCookie(res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/eventos', authenticate, requireRole('agente'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = requiredText(body.nombre, 'El nombre', 150);
    const description = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
    const cityId = positiveInteger(body.idCiudad, 'La ciudad');
    const capacity = positiveInteger(body.capacidad, 'La capacidad');
    const price = Number(body.precio);
    if (!Number.isFinite(price) || price < 0 || price > 9999999999.99) {
      throw new ApiError(400, 'El precio debe ser un valor igual o mayor que cero.');
    }
    const startsAt = requiredText(body.fechaInicio, 'La fecha de inicio', 19);
    const endsAt = requiredText(body.fechaFin, 'La fecha de finalización', 19);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt) ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(endsAt) ||
        !Number.isFinite(new Date(startsAt).getTime()) ||
        !Number.isFinite(new Date(endsAt).getTime()) ||
        new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
      throw new ApiError(400, 'La fecha de finalización debe ser posterior al inicio.');
    }

    const result = await db.query(
      `INSERT INTO evento
         (nombre, descripcion, fecha_inicio, fecha_fin, capacidad, precio, id_ciudad, id_agente)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_evento AS id`,
      [name, description || null, startsAt, endsAt, capacity, price, cityId, req.user.idPersona]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    next(error);
  }
});

app.get('/api/agente/eventos', authenticate, requireRole('agente'), async (req, res, next) => {
  try {
    const result = await db.query(
      `${eventSelect} WHERE e.id_agente = $1 ORDER BY e.fecha_inicio`,
      [req.user.idPersona]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/reservas/agente', authenticate, requireRole('agente'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.id_reserva AS id,
              r.fecha_reserva AS "fechaReserva",
              r.estado,
              p.primer_nombre AS "primerNombre",
              p.segundo_nombre AS "segundoNombre",
              p.primer_apellido AS "primerApellido",
              p.segundo_apellido AS "segundoApellido",
              p.correo,
              e.id_evento AS "idEvento",
              e.nombre AS evento,
              to_char(e.fecha_inicio, 'YYYY-MM-DD"T"HH24:MI:SS') AS "fechaInicio",
              ci.nombre AS ciudad,
              e.precio,
              e.capacidad
       FROM reserva r
       JOIN cliente cl ON cl.id_cliente = r.id_cliente
       JOIN persona p ON p.id_persona = cl.id_cliente
       JOIN evento e ON e.id_evento = r.id_evento
       JOIN ciudad ci ON ci.id_ciudad = e.id_ciudad
       WHERE e.id_agente = $1
       ORDER BY r.fecha_reserva DESC`,
      [req.user.idPersona]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/reservas/mias', authenticate, requireRole('cliente'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.id_reserva AS id,
              r.fecha_reserva AS "fechaReserva",
              r.estado,
              e.id_evento AS "idEvento",
              e.nombre AS evento,
              to_char(e.fecha_inicio, 'YYYY-MM-DD"T"HH24:MI:SS') AS "fechaInicio",
              ci.nombre AS ciudad,
              e.precio
       FROM reserva r
       JOIN evento e ON e.id_evento = r.id_evento
       JOIN ciudad ci ON ci.id_ciudad = e.id_ciudad
       WHERE r.id_cliente = $1
       ORDER BY r.fecha_reserva DESC`,
      [req.user.idPersona]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/reservas', authenticate, requireRole('cliente'), async (req, res, next) => {
  let client;
  try {
    const body = req.body || {};
    const eventId = positiveInteger(body.idEvento, 'El evento');
    const quantity = positiveInteger(body.cantidad, 'La cantidad');
    if (quantity > 6) {
      throw new ApiError(400, 'Puedes reservar hasta 6 entradas por solicitud.');
    }

    client = await db.connect();
    await client.query('BEGIN');
    const eventResult = await client.query(
      'SELECT capacidad FROM evento WHERE id_evento = $1 FOR UPDATE',
      [eventId]
    );
    if (!eventResult.rowCount) {
      throw new ApiError(404, 'No encontramos ese evento.');
    }
    const reservationCount = await client.query(
      `SELECT count(*)::int AS cantidad
       FROM reserva
       WHERE id_evento = $1 AND upper(estado) <> 'CANCELADA'`,
      [eventId]
    );
    const available = eventResult.rows[0].capacidad - reservationCount.rows[0].cantidad;
    if (available < quantity) {
      throw new ApiError(409, `Solo quedan ${Math.max(available, 0)} entradas disponibles.`);
    }
    const result = await client.query(
      `INSERT INTO reserva (id_cliente, id_evento)
       SELECT $1, $2 FROM generate_series(1, $3::integer)
       RETURNING id_reserva AS id`,
      [req.user.idPersona, eventId, quantity]
    );
    await client.query('COMMIT');
    res.status(201).json({ reservas: result.rows, estado: 'PENDIENTE' });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(rollbackError => next(rollbackError));
    next(error);
  } finally {
    client?.release();
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El cuerpo de la solicitud no contiene JSON válido.' });
    return;
  }
  if (error.code === '23505') {
    res.status(409).json({ error: 'Ya existe un registro con uno de esos datos.' });
    return;
  }
  if (error.code === '23503') {
    res.status(400).json({ error: 'La ubicación o el evento seleccionado ya no existe.' });
    return;
  }
  console.error('Error en la API:', error);
  res.status(500).json({ error: 'Ocurrió un error inesperado. Inténtalo de nuevo.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API EventStage disponible en http://localhost:${PORT}`);
  });
}

module.exports = app;
