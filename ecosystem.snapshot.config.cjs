module.exports = {
  apps: [
    {
      name: 'snapshot-scheduler',
      script: './snapshot-scheduler.js',
      cwd: '/home/user/webapp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/snapshot-error.log',
      out_file: './logs/snapshot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};
