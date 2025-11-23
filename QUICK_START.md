# 🛡️ 进程守护者 - 快速开始

## 一键启动

```bash
./start-guardian.sh
```

## 访问控制台

**Web控制台地址**: http://localhost:3001

**功能**:
- ✅ 实时查看所有进程运行状态
- ✅ 查看健康检查结果
- ✅ 查看重启历史和告警日志
- ✅ 自动30秒刷新

## 监控的进程

| 进程名 | 功能 | 执行频率 | 优先级 |
|--------|------|---------|--------|
| kline-scheduler | K线数据同步 | 5分钟 | ⭐⭐⭐⭐⭐ |
| analysis-scheduler | 价格分析 | 5分钟 | ⭐⭐⭐⭐ |
| snapshot-scheduler | 数据快照 | 10分钟 | ⭐⭐⭐ |
| consecutive-rise-scheduler | 连续上涨统计 | 15分钟 | ⭐⭐ |
| health-monitor | 系统健康监控 | 4分钟 | ⭐⭐ |

## 常用命令

```bash
# 查看所有进程
pm2 list

# 查看守护者日志
pm2 logs process-guardian

# 查看特定进程日志
pm2 logs kline-scheduler

# 重启守护者
pm2 restart process-guardian

# 停止守护者
pm2 stop process-guardian
```

## 工作原理

守护者每5分钟自动检查所有进程：

1. **检查进程是否存在** → 不存在则启动
2. **检查进程是否运行** → 停止则重启
3. **执行健康检查** → 不健康则重启

## 详细文档

查看完整文档: [PROCESS_GUARDIAN_README.md](./PROCESS_GUARDIAN_README.md)
