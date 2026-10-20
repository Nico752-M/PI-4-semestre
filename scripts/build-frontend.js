const fs = require('node:fs');
const path = require('node:path');

const frontendDirectory = path.join(__dirname, '..', 'frontend', 'src');
const publicDirectory = path.join(__dirname, '..', 'public');

fs.cpSync(frontendDirectory, publicDirectory, { recursive: true });
