// 简化配置：只启动主服务，不启动调度器
// 避免调度器疯狂请求外部API导致系统卡死

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
    }
  ]
}
