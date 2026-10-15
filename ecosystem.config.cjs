module.exports = {
  apps: [
    {
      name: 'portal-lamundial',
      script: 'serve',
      // Carpeta del repo en cada servidor (jsoto@120, proyect@121, …).
      cwd: __dirname,
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 5190,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      }
    }
  ]
};
