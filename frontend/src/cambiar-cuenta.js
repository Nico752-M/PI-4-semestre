(function () {
  const tipo = localStorage.getItem('tipoCuenta') || 'cliente';
  const nuevo = tipo === 'agente' ? 'cliente' : 'agente';

  const btn = document.createElement('button');
  btn.textContent = 'Modo: ' + tipo + ' → cambiar a ' + nuevo;
  btn.style.cssText =
    'position:fixed;bottom:16px;left:16px;z-index:9999;padding:10px 14px;' +
    'border:1px solid #e2ad57;border-radius:8px;background:#1c1730;' +
    'color:#e2ad57;font:700 12px Arial;cursor:pointer;';

  btn.onclick = function () {
    localStorage.setItem('tipoCuenta', nuevo);
    location.href = nuevo === 'agente' ? 'mis-eventos.html' : 'index.html';
  };

  document.body.appendChild(btn);
})();