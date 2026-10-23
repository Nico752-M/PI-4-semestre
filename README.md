# EventStage

## Conectar Neon y ejecutar la aplicación

1. En Neon, ejecuta en orden `database/migrations/001_add_password_hash.sql`, `database/migrations/002_seed_colombia_locations.sql` y `database/migrations/003_create_sessions.sql` después de crear las tablas del proyecto. Agregan el hash de contraseña, las cinco ciudades que ya mostraba la interfaz y las sesiones revocables. Las migraciones son seguras para volver a ejecutar. Las cuentas creadas antes de la primera migración deben restablecer su contraseña mediante un proceso de confianza antes de poder iniciar sesión.
2. Copia `.env.example` a `.env` y configura `DATABASE_URL` con la cadena de conexión de Neon y `SESSION_SECRET` con un secreto aleatorio de al menos 32 caracteres. No publiques `.env`.
3. Instala dependencias con `npm install` y ejecuta el backend con `npm start`. Si ya había un backend ejecutándose, detenlo y vuelve a iniciarlo para cargar estas rutas. La API queda disponible en `http://localhost:3000` (o en el puerto configurado en `PORT`).
4. Sirve `frontend/src` con Live Server en `http://localhost:5500` y abre `views/clientes/index.html`. Si usas otro origen, actualiza `FRONTEND_ORIGIN` y el valor `window.EVENTSTAGE_API_URL` en `frontend/src/api.js`.

El endpoint `http://localhost:3000/api/health` verifica la conexión con Neon. Para que los selectores de ubicación funcionen, las tablas `pais`, `departamento` y `ciudad` deben tener datos.

## Desplegar en Vercel

El proyecto está preparado para desplegar el frontend y la API bajo el mismo dominio usando la detección automática de Express de Vercel. Configura **Root Directory** como la raíz del repositorio (`.`), conserva el **Framework Preset** detectado automáticamente y deja vacíos **Build Command** y **Output Directory** para que Vercel detecte y despliegue Express. El frontend se sirve desde `public`; después de cambiar archivos en `frontend/src`, ejecuta `npm run build` y sube los cambios generados en `public` junto con el código. Define `DATABASE_URL` con la conexión de Neon, `SESSION_SECRET` con un secreto aleatorio de al menos 32 caracteres y `FRONTEND_ORIGIN` con el dominio de producción, por ejemplo `https://eventstage.vercel.app`. Configura estas variables para el entorno Production y vuelve a desplegar después de guardarlas. No subas el archivo `.env` a GitHub.

## Integraciones

- Registro e inicio de sesión para clientes y agentes; las sesiones usan una cookie `HttpOnly`.
- Acceso administrativo desde `views/admins/login.html`; requiere una cuenta de administrador provisionada de forma confiable en Neon. El registro público no permite crear administradores.
- Lectura de países, departamentos, ciudades y eventos.
- Creación de eventos por agentes autenticados.
- Compra simulada de entradas, consulta de sus códigos y visualización de reservas antiguas con su estado.
- Los paneles administrativos consultan cuentas, agentes, eventos y reservas desde Neon. Los paneles de agente muestran sus eventos y reservas desde las mismas tablas.

El esquema actual guarda una fila en `reserva` por cada entrada comprada. El checkout disponible es una simulación: acepta datos ficticios sin validar la tarjeta, confirma la compra como `CONFIRMADA` y calcula el total desde el precio vigente del evento. Los datos de tarjeta no se envían a la API ni se guardan, y no se procesa ningún cargo real. No ingreses datos de una tarjeta real. Solo las entradas confirmadas ocupan capacidad. El esquema no incluye pagos reales, categorías, imágenes ni localidades con precios independientes. Agentes pueden editar sus eventos y administradores cualquier evento; la capacidad no se puede reducir por debajo de las entradas confirmadas.

Las vistas de favoritos y preferencias se retiraron porque el esquema no tiene entidades para persistir esos datos. La administración de solicitudes de soporte tampoco está implementada; la página de ayuda de agentes conserva únicamente el contacto informativo. Las reservas pendientes creadas por versiones anteriores no son entradas compradas ni descuentan capacidad.

## Inventario de archivos

Consulta `INVENTARIO_ARCHIVOS.txt` para conocer el propósito de los archivos del proyecto. `public/` contiene las copias generadas para Vercel a partir de `frontend/src/`; edita los archivos fuente y vuelve a ejecutar `npm run build`.
