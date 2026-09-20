module.exports = {
  apps: [
    {
      name: 'portal-lamundial',
      script: 'serve',
      cwd: '/home/jsoto/portal',
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 5190,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      }
    }
  ]
};
