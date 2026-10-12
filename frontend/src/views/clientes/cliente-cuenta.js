(function () {
  const favoriteGrid = document.getElementById('favorite-grid');
  if (favoriteGrid) {
    const emptyState = document.getElementById('favorite-empty');
    const status = document.getElementById('favorite-status');

    favoriteGrid.addEventListener('click', event => {
      const button = event.target instanceof Element && event.target.closest('.favorite-remove');
      if (!button) return;

      const title = button.closest('.favorite-card').querySelector('h2').textContent;
      button.closest('.favorite-card').remove();
      status.textContent = `${title} se quitó de tus favoritos.`;
      if (!favoriteGrid.querySelector('.favorite-card')) emptyState.hidden = false;
    });
  }

  const settingsForm = document.getElementById('customer-settings');
  if (!settingsForm) return;

  const storageKey = 'eventstage-preferencias-cliente';
  const defaults = {
    newEvents: true,
    bookingUpdates: true,
    offers: false,
    recommendations: true
  };

  let preferences = defaults;
  const status = document.getElementById('settings-status');
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new TypeError('El formato guardado no es válido.');
      }
      preferences = Object.fromEntries(
        Object.keys(defaults).map(key => [key, typeof parsed[key] === 'boolean' ? parsed[key] : defaults[key]])
      );
    }
  } catch (error) {
    console.error('No se pudieron cargar las preferencias guardadas.', error);
    status.textContent = 'No se pudieron cargar las preferencias guardadas.';
  }

  Object.entries(preferences).forEach(([key, value]) => {
    settingsForm.elements.namedItem(key).checked = value;
  });

  settingsForm.addEventListener('submit', event => {
    event.preventDefault();
    const nextPreferences = Object.fromEntries(
      Object.keys(defaults).map(key => [key, settingsForm.elements.namedItem(key).checked])
    );

    try {
      localStorage.setItem(storageKey, JSON.stringify(nextPreferences));
      status.textContent = 'Tus preferencias se guardaron en este navegador.';
    } catch (error) {
      console.error('No se pudieron guardar las preferencias.', error);
      status.textContent = 'No se pudieron guardar tus preferencias. Inténtalo de nuevo.';
    }
  });
})();
