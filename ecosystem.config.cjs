module.exports = {
  apps: [
    {
      name: 'crypto-monitor',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'analysis-scheduler',
      script: './analysis-scheduler.js',
      env: {
        ANALYSIS_ENDPOINT: 'http://localhost:3000/api/analyze',
        ANALYSIS_INTERVAL: '300000' // 5分钟 = 300000毫秒
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 5000, // 重启延迟5秒
      max_restarts: 10 // 最多重启10次
    },
    {
      name: 'kline-scheduler',
      script: './scheduler.js',
      env: {
        API_ENDPOINT: 'http://localhost:3000/api/kline/sync/auto',
        SYNC_INTERVAL: '900000' // 15分钟 = 900000毫秒
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 5000, // 重启延迟5秒
      max_restarts: 10 // 最多重启10次
    },
    {
      name: 'signal-scheduler',
      script: './signal-scheduler.cjs',
      env: {
        SIGNAL_ENDPOINT: 'http://localhost:3000/api/signal/all',
        SIGNAL_INTERVAL: '60000', // 1分钟 = 60000毫秒
        ENABLE_TELEGRAM: 'true'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 10000, // 重启延迟10秒，等待服务完全启动
      max_restarts: 10 // 最多重启10次
    },
    {
      name: 'db-backup-scheduler',
      script: './scripts/auto-backup-cron.sh',
      cron_restart: '0 */12 * * *', // 每12小时执行一次（0点和12点）
      watch: false,
      autorestart: false, // cron模式不需要自动重启
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
