(function () {
  const status = document.getElementById('auth-status');
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

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
            recordarme: loginForm.elements.namedItem('recordarme').checked
          }
        });
        const defaultDestination = result.user.rol === 'agente'
          ? '../agentes/dashboard.html'
          : result.user.rol === 'administrador'
            ? '../admins/dashboard.html'
            : 'index.html';
        const returnUrl = new URLSearchParams(location.search).get('returnUrl');
        if (returnUrl) {
          const destination = new URL(returnUrl, location.origin);
          if (destination.origin === location.origin) {
            location.href = destination.href;
            return;
          }
        }
        location.href = defaultDestination;
      } catch (error) {
        status.textContent = error.message;
        submitButton.disabled = false;
      }
    });
  }
})();
