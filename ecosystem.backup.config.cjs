module.exports = {
  apps: [
    {
      name: 'db-backup',
      script: '/home/user/webapp/scripts/hourly-backup.sh',
      cron_restart: '0 * * * *', // 每小时执行一次
      autorestart: false,
      watch: false,
      exec_mode: 'fork'
    }
  ]
}
