(function () {
  const status = document.getElementById('auth-status');
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  function destinationForRole(role) {
    if (role === 'agente') return '../agentes/dashboard.html';
    if (role === 'administrador') return '../admins/dashboard.html';
    return '../clientes/index.html';
  }

  if (loginForm) {
    window.EventStageApi.request('/auth/me')
      .then(({ user }) => {
        const requiredRole = document.body.dataset.loginRole;
        if (requiredRole && user.rol !== requiredRole) return;
        location.replace(destinationForRole(user.rol));
      })
      .catch(error => {
        if (error.status !== 401) {
          status.textContent = error.message;
          console.error('No se pudo verificar la sesión existente.', error);
        }
      });
  }

  if (registerForm) {
    const country = document.getElementById('pais');
    const department = document.getElementById('departamento');
    const city = document.getElementById('ciudad');
    window.EventStageApi.setupLocationSelects(country, department, city, status);

    registerForm.addEventListener('submit', async event => {
      event.preventDefault();
      const password = registerForm.elements.namedItem('password').value;
      const confirmation = registerForm.elements.namedItem('confirmar-password').value;
      if (password !== confirmation) {
        status.textContent = 'Las contraseñas no coinciden.';
        return;
      }

      const submitButton = registerForm.querySelector('[type="submit"]');
      submitButton.disabled = true;
      status.textContent = 'Creando tu cuenta...';
      try {
        const role = registerForm.querySelector('input[name="tipo-cuenta"]:checked').value;
        await window.EventStageApi.request('/auth/register', {
          method: 'POST',
          body: {
            rol: role,
            primerNombre: registerForm.elements.namedItem('primerNombre').value,
            segundoNombre: registerForm.elements.namedItem('segundoNombre').value,
            primerApellido: registerForm.elements.namedItem('primerApellido').value,
            segundoApellido: registerForm.elements.namedItem('segundoApellido').value,
            identificacion: registerForm.elements.namedItem('identificacion').value,
            telefono: registerForm.elements.namedItem('telefono').value,
            correo: registerForm.elements.namedItem('correo').value,
            idCiudad: city.value,
            password
          }
        });
        location.href = role === 'agente' ? '../agentes/dashboard.html' : 'index.html';
      } catch (error) {
        status.textContent = error.message;
        submitButton.disabled = false;
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const submitButton = loginForm.querySelector('[type="submit"]');
      submitButton.disabled = true;
      status.textContent = 'Verificando tus datos...';
      try {
        const result = await window.EventStageApi.request('/auth/login', {
          method: 'POST',
          body: {
            correo: loginForm.elements.namedItem('email').value,
            password: loginForm.elements.namedItem('password').value,
            recordarme: loginForm.elements.namedItem('recordarme').checked,
            requiredRole: document.body.dataset.loginRole || undefined
          }
        });
        const requiredRole = document.body.dataset.loginRole;
        if (requiredRole && result.user.rol !== requiredRole) {
          throw new Error('Esta página es exclusiva para cuentas de administrador.');
        }
        const returnUrl = new URLSearchParams(location.search).get('returnUrl');
        if (returnUrl) {
          const destination = new URL(returnUrl, location.origin);
          const isAllowedReturnUrl = destination.origin === location.origin &&
            (requiredRole !== 'administrador' || destination.pathname.startsWith('/views/admins/'));
          if (isAllowedReturnUrl) {
            location.href = destination.href;
            return;
          }
        }
        location.href = destinationForRole(result.user.rol);
      } catch (error) {
        status.textContent = error.message;
        submitButton.disabled = false;
      }
    });
  }
})();
