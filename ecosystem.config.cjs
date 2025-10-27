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
    }
  ]
}
