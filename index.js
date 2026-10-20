const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.redirect(302, '/views/clientes/index.html');
});

app.use(require('./backend/src/server'));

module.exports = app;
