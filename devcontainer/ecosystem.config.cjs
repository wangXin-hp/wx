/* eslint-disable @typescript-eslint/no-require-imports -- PM2 loads this file as CommonJS. */
const path = require('node:path')

module.exports = {
  apps: [
    {
      name: 'tracekit-backend',
      cwd: path.resolve(__dirname, '..', 'apps', 'backend'),
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', PORT: 3000 },
    },
  ],
}
