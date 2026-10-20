(function () {
  function filterTable(card) {
    const search = (card.querySelector('[data-admin-search]')?.value || '').trim().toLocaleLowerCase('es');
    const status = card.querySelector('[data-admin-status]')?.value || '';
    const rows = card.querySelectorAll('[data-admin-row]');

    rows.forEach(row => {
      const matchesSearch = row.textContent.toLocaleLowerCase('es').includes(search);
      const matchesStatus = !status || row.dataset.status === status;
      row.hidden = !matchesSearch || !matchesStatus;
    });
  }

  document.querySelectorAll('[data-admin-table]').forEach(card => {
    card.querySelectorAll('[data-admin-search], [data-admin-status]').forEach(control => {
      control.addEventListener('input', () => filterTable(card));
      control.addEventListener('change', () => filterTable(card));
    });
  });
})();
