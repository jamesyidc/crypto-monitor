# 系统健康监控设置文档

## 📋 概述

已成功部署完整的系统健康监控系统，包括：
- 🔄 自动健康检查（每4分钟）
- 🖥️ 可视化监控中控台
- 📊 历史记录追踪（最近10次）
- 🚨 自动故障恢复
- 📝 详细日志记录

## 🎯 功能特性

### 监控项目
1. **端口状态** - 检查端口3000是否被占用
2. **数据库状态** - 验证数据库文件完整性和可访问性
3. **HTTP响应** - 测试应用HTTP响应时间和状态码
4. **API端点** - 验证API端点功能正常
5. **系统资源** - 监控内存和磁盘使用情况
6. **进程状态** - 检查应用进程是否运行

### 自动修复功能
- ✅ 端口未占用时自动重启服务
- ✅ 进程异常退出时自动重启
- ✅ 详细错误日志记录
- ✅ 自动重试机制

## 📁 文件结构

```
/home/user/webapp/
├── health-monitor.js                    # 健康监控脚本
├── ecosystem.health-monitor.config.cjs  # PM2配置文件
├── public/
│   └── health-monitor.html              # 监控中控台页面
├── public/static/
│   └── health-status.json               # 健康状态数据（自动生成）
├── health-monitor.log                   # 监控日志（自动生成）
└── logs/
    ├── health-monitor-out.log           # PM2输出日志
    └── health-monitor-error.log         # PM2错误日志
```

## 🚀 使用方法

### 启动监控系统

```bash
cd /home/user/webapp
pm2 start ecosystem.health-monitor.config.cjs
```

### 查看监控状态

```bash
pm2 status health-monitor
```

### 查看监控日志

```bash
# PM2日志
pm2 logs health-monitor --nostream --lines 50

# 监控系统日志
tail -f health-monitor.log
```

### 停止监控系统

```bash
pm2 stop health-monitor
```

### 重启监控系统

```bash
pm2 restart health-monitor
```

## 🖥️ 中控台访问

### 访问地址
- **沙箱环境**: https://3000-icqnmsh11tns0wbrnqrzs-dfc00ec5.sandbox.novita.ai/health-monitor
- **本地开发**: http://localhost:3000/health-monitor

### 功能说明

#### 1. 总体状态显示
- 🟢 绿色圆圈 - 系统正常
- 🟡 黄色圆圈（闪烁）- 系统警告
- 🔴 红色圆圈（闪烁）- 系统异常

#### 2. 最新检查详情
显示所有监控项的实时状态：
- 端口状态（显示进程PID）
- 数据库状态（大小和最后修改时间）
- HTTP响应时间
- API端点状态
- 系统资源使用率
- 进程数量

#### 3. 历史记录表格
- 显示最近10次检查记录
- 包含完整时间戳
- 显示相对时间（X分钟前）
- 所有监控项的状态一览

#### 4. 自动刷新
- 页面每30秒自动刷新数据
- 手动刷新按钮随时可用
- 页面切换时智能暂停/恢复刷新

## 📊 监控数据格式

### health-status.json 结构

```json
{
  "lastUpdate": "2025-11-01T00:53:09.074Z",
  "records": [
    {
      "timestamp": "2025-11-01T00:53:06.791Z",
      "timestampDisplay": "2025-11-01 00:53:06",
      "port": {
        "status": "ok",
        "pid": "1351",
        "message": "端口 3000 正在被 PID 1351 使用"
      },
      "database": {
        "status": "ok",
        "size": "58.06 MB",
        "lastModified": "2025-11-01 00:46:11",
        "message": "数据库正常 (58.06 MB)"
      },
      "http": {
        "status": "ok",
        "statusCode": "200",
        "responseTime": "5 ms",
        "message": "HTTP响应正常 (5 ms)"
      },
      "api": {
        "status": "ok",
        "message": "API端点响应正常"
      },
      "system": {
        "status": "ok",
        "memory": "23.2%",
        "disk": "33%",
        "message": "系统资源正常 (内存: 23.2%, 磁盘: 33%)"
      },
      "process": {
        "status": "ok",
        "count": 18,
        "message": "发现 18 个相关进程"
      },
      "overall": "ok",
      "overallMessage": "系统正常"
    }
  ],
  "config": {
    "checkInterval": "4 分钟",
    "port": 3000,
    "maxRecords": 10
  }
}
```

## ⚙️ 配置选项

### health-monitor.js 配置

```javascript
const CONFIG = {
  checkInterval: 4 * 60 * 1000,  // 检查间隔：4分钟
  port: 3000,                      // 监控端口
  appUrl: 'http://localhost:3000', // 应用URL
  dbPath: '.wrangler/state/...',   // 数据库路径
  logFile: 'health-monitor.log',   // 日志文件
  statusFile: 'public/static/health-status.json',  // 状态文件
  maxRecords: 10,                  // 最大记录数
  restartCommand: 'npm run dev:sandbox'  // 重启命令
};
```

### 修改检查间隔

编辑 `health-monitor.js`：

```javascript
checkInterval: 2 * 60 * 1000,  // 改为2分钟
```

修改后重启监控系统：

```bash
pm2 restart health-monitor
```

## 🔍 故障排查

### 监控系统未启动

```bash
# 检查PM2状态
pm2 list

# 如果未运行，启动它
pm2 start ecosystem.health-monitor.config.cjs
```

### 数据未更新

```bash
# 查看监控日志
pm2 logs health-monitor --nostream --lines 50

# 检查健康状态文件
cat public/static/health-status.json
```

### 自动重启失败

查看日志找到具体错误：

```bash
tail -f health-monitor.log
```

常见问题：
- 端口被其他进程占用
- 数据库文件权限问题
- 内存不足

## 📈 性能影响

### 资源使用
- CPU: < 1%
- 内存: ~40 MB
- 磁盘I/O: 最小

### 检查开销
- 单次检查时间: 2-3秒
- 每4分钟执行一次
- 对应用性能影响可忽略不计

## 🔐 安全考虑

### 访问控制
- 监控页面通过主应用路由
- 无独立认证（使用应用级认证）
- 状态文件为只读JSON

### 数据隐私
- 不记录敏感信息
- 不包含数据库内容
- 仅记录系统指标

## 🎓 最佳实践

### 1. 定期检查监控日志
```bash
# 每周查看一次
tail -100 health-monitor.log | grep ERROR
```

### 2. 监控磁盘空间
```bash
# 日志轮转（如果需要）
truncate -s 0 health-monitor.log
```

### 3. 设置告警阈值
可以基于 health-status.json 设置外部告警：
- 响应时间 > 1000ms
- 内存使用 > 80%
- 磁盘使用 > 90%
- 连续3次检查失败

### 4. 备份健康数据
```bash
# 定期备份状态文件
cp public/static/health-status.json backups/health-$(date +%Y%m%d).json
```

## 📝 维护任务

### 每日
- [ ] 查看中控台确认系统正常
- [ ] 检查是否有异常告警

### 每周
- [ ] 审查监控日志
- [ ] 检查磁盘空间
- [ ] 验证自动重启功能

### 每月
- [ ] 清理旧日志文件
- [ ] 检查监控系统更新
- [ ] 审查配置参数

## 🆘 紧急响应

### 系统完全不可用

1. 检查端口占用
```bash
lsof -i:3000
```

2. 手动停止所有进程
```bash
pkill -9 workerd
pkill -9 wrangler
```

3. 重启服务
```bash
cd /home/user/webapp
npm run dev:sandbox
```

4. 重启监控
```bash
pm2 restart health-monitor
```

### 数据库损坏

1. 停止应用
```bash
pm2 stop all
```

2. 从备份恢复
```bash
cp db_backups/after_signal_regeneration_20251029_154443.sqlite \
   .wrangler/state/v3/d1/miniflare-D1DatabaseObject/c7d58e8fb3b7dbec64a6e1c2fad7b8e06c49e3b8ed1d3a0c56e22c37e0152e1e.sqlite
```

3. 重启应用
```bash
pm2 restart all
```

## 📞 支持信息

- **监控脚本**: `/home/user/webapp/health-monitor.js`
- **中控台**: `/health-monitor`
- **状态API**: `/static/health-status.json`
- **日志文件**: `health-monitor.log`

## 🎉 部署验证

### 验证清单
- ✅ 监控脚本正常运行（PM2状态：online）
- ✅ 中控台页面可访问
- ✅ 状态文件正常生成和更新
- ✅ 日志文件正常写入
- ✅ 自动检查每4分钟执行
- ✅ 最新状态显示在中控台
- ✅ 历史记录正常显示

### 当前状态
```
✅ 监控系统：运行中
✅ 检查间隔：每4分钟
✅ 中控台：https://3000-icqnmsh11tns0wbrnqrzs-dfc00ec5.sandbox.novita.ai/health-monitor
✅ 最后检查：2025-11-01 00:53:06
✅ 系统状态：正常
```

---

**文档版本**: 1.0  
**创建日期**: 2025-11-01  
**最后更新**: 2025-11-01  
**维护者**: AI Development Team
