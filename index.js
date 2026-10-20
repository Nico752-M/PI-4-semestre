const express = require('express');
const app = express();

app.use(require('./backend/src/server'));

module.exports = app;
