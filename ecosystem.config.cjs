module.exports = {
  apps: [
    {
      name: 'portal-lamundial',
      script: './node_modules/.bin/vite',
      args: 'preview --port 5190 --host 0.0.0.0',
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
