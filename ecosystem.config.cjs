module.exports = {
  apps: [
    {
      name: 'portal-lamundial',
      script: 'npx',
      args: 'serve -s dist -l 5190 --no-clipboard',
      cwd: '/home/jsoto/portal',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5190,
      },
    },
  ],
};
