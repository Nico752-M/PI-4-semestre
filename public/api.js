(function () {
  const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const apiBaseUrl = window.EVENTSTAGE_API_URL ||
    (isLocalDevelopment ? 'http://localhost:3000/api' : '/api');

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    let body = options.body;
    if (body !== undefined && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers,
        body,
        credentials: 'include'
      });
    } catch {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
    }

    if (response.status === 204) return null;
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;
    if (!response.ok) {
      const error = new Error(data?.error || 'No se pudo completar la solicitud.');
      error.status = response.status;
      throw error;
    }
    if (!isJson) {
      throw new Error('El servidor devolvió una respuesta no válida.');
    }
    return data;
  }

  function setOptions(select, items, placeholder) {
    select.replaceChildren(new Option(placeholder, ''));
    items.forEach(item => select.add(new Option(item.nombre, item.id)));
    select.disabled = items.length === 0;
  }

  async function setupLocationSelects(countrySelect, departmentSelect, citySelect, status, selectedCityId) {
    setOptions(departmentSelect, [], 'Selecciona un departamento');
    setOptions(citySelect, [], 'Selecciona una ciudad');
    departmentSelect.disabled = true;
    citySelect.disabled = true;

    try {
      const countries = await request('/paises');
      setOptions(countrySelect, countries, 'Selecciona un país');
      countrySelect.disabled = countries.length === 0;
      if (selectedCityId) {
        let selectedLocation = null;
        for (const country of countries) {
          const departments = await request(`/departamentos?paisId=${encodeURIComponent(country.id)}`);
          for (const department of departments) {
            const cities = await request(`/ciudades?departamentoId=${encodeURIComponent(department.id)}`);
            if (cities.some(city => String(city.id) === String(selectedCityId))) {
              selectedLocation = { country, department, cities };
              break;
            }
          }
          if (selectedLocation) break;
        }
        if (!selectedLocation) throw new Error('No se encontró la ubicación actual del evento.');
        countrySelect.value = String(selectedLocation.country.id);
        setOptions(departmentSelect, [selectedLocation.department], 'Selecciona un departamento');
        departmentSelect.value = String(selectedLocation.department.id);
        setOptions(citySelect, selectedLocation.cities, 'Selecciona una ciudad');
        citySelect.value = String(selectedCityId);
      }
    } catch (error) {
      status.textContent = error.message;
      console.error('No se pudieron cargar los países.', error);
    }

    countrySelect.addEventListener('change', async () => {
      setOptions(departmentSelect, [], 'Cargando departamentos...');
      setOptions(citySelect, [], 'Selecciona una ciudad');
      citySelect.disabled = true;
      if (!countrySelect.value) {
        setOptions(departmentSelect, [], 'Selecciona un departamento');
        return;
      }
      try {
        const departments = await request(`/departamentos?paisId=${encodeURIComponent(countrySelect.value)}`);
        setOptions(departmentSelect, departments, 'Selecciona un departamento');
      } catch (error) {
        status.textContent = error.message;
        console.error('No se pudieron cargar los departamentos.', error);
        setOptions(departmentSelect, [], 'No se pudieron cargar');
      }
    });

    departmentSelect.addEventListener('change', async () => {
      setOptions(citySelect, [], 'Cargando ciudades...');
      if (!departmentSelect.value) {
        setOptions(citySelect, [], 'Selecciona una ciudad');
        return;
      }
      try {
        const cities = await request(`/ciudades?departamentoId=${encodeURIComponent(departmentSelect.value)}`);
        setOptions(citySelect, cities, 'Selecciona una ciudad');
      } catch (error) {
        status.textContent = error.message;
        console.error('No se pudieron cargar las ciudades.', error);
        setOptions(citySelect, [], 'No se pudieron cargar');
      }
    });
  }

  window.EventStageApi = { request, setupLocationSelects };
})();
