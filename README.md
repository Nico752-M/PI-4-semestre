# EventStage

## Conectar Neon y ejecutar la aplicación

1. En Neon, ejecuta en orden `database/migrations/001_add_password_hash.sql`, `database/migrations/002_seed_colombia_locations.sql` y `database/migrations/003_create_sessions.sql` después de crear las tablas del proyecto. Agregan el hash de contraseña, las cinco ciudades que ya mostraba la interfaz y las sesiones revocables. Las migraciones son seguras para volver a ejecutar. Las cuentas creadas antes de la primera migración deben restablecer su contraseña mediante un proceso de confianza antes de poder iniciar sesión.
2. Copia `.env.example` a `.env` y configura `DATABASE_URL` con la cadena de conexión de Neon y `SESSION_SECRET` con un secreto aleatorio de al menos 32 caracteres. No publiques `.env`.
3. Instala dependencias con `npm install` y ejecuta el backend con `npm start`. Si ya había un backend ejecutándose, detenlo y vuelve a iniciarlo para cargar estas rutas. La API queda disponible en `http://localhost:3000` (o en el puerto configurado en `PORT`).
4. Sirve `frontend/src` con Live Server en `http://localhost:5500` y abre `views/clientes/index.html`. Si usas otro origen, actualiza `FRONTEND_ORIGIN` y el valor `window.EVENTSTAGE_API_URL` en `frontend/src/api.js`.

El endpoint `http://localhost:3000/api/health` verifica la conexión con Neon. Para que los selectores de ubicación funcionen, las tablas `pais`, `departamento` y `ciudad` deben tener datos.

## Desplegar en Vercel

El proyecto está preparado para desplegar el frontend y la API bajo el mismo dominio usando la detección de Express de Vercel. Configura **Root Directory** como la raíz del repositorio (`.`), deja **Output Directory** sin definir y usa `npm run build` como Build Command para copiar las páginas a `public`. Define `DATABASE_URL` con la conexión de Neon, `SESSION_SECRET` con un secreto aleatorio de al menos 32 caracteres y `FRONTEND_ORIGIN` con el dominio de producción, por ejemplo `https://eventstage.vercel.app`. Configura estas variables para el entorno Production y vuelve a desplegar después de guardarlas. No subas el archivo `.env` a GitHub.

## Integraciones

- Registro e inicio de sesión para clientes y agentes; las sesiones usan una cookie `HttpOnly`.
- Lectura de países, departamentos, ciudades y eventos.
- Creación de eventos por agentes autenticados.
- Creación de reservas pendientes y consulta de las reservas del cliente autenticado.

El esquema actual guarda una fila en `reserva` por cada entrada. Las reservas quedan como `PENDIENTE`; el esquema no incluye pagos, categorías, imágenes ni localidades con precios independientes.
