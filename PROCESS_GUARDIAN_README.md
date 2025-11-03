# 🛡️ 进程守护者 (Process Guardian)

## 📋 功能概述

进程守护者是一个自动化的进程监控和管理系统，用于确保所有关键后台任务稳定运行。

### 核心功能

1. **自动监控** - 每5分钟检查一次所有关键进程
2. **自动恢复** - 发现进程崩溃或异常时自动重启
3. **健康检查** - 不仅检查进程存在，还验证功能是否正常
4. **Web控制台** - 提供可视化界面查看进程状态和日志
5. **告警系统** - 记录所有异常事件和重启操作

---

## 🎯 监控的后台进程

### 1. **kline-scheduler** (K线数据同步调度器)
- **功能**: 每5分钟从OKX API同步最新K线数据
- **重要性**: ⭐⭐⭐⭐⭐ (最高优先级)
- **作用**: 为"当天涨幅"等数据提供基础数据源
- **健康检查**: 验证API能否返回最新数据

### 2. **analysis-scheduler** (价格分析调度器)
- **功能**: 每5分钟执行价格变动分析和信号检测
- **重要性**: ⭐⭐⭐⭐
- **作用**: 分析价格变化，生成交易信号
- **健康检查**: 验证信号API是否响应

### 3. **snapshot-scheduler** (数据快照调度器)
- **功能**: 每10分钟保存完整首页数据快照
- **重要性**: ⭐⭐⭐
- **作用**: 用于历史数据回溯和趋势分析
- **健康检查**: 无需特殊检查

### 4. **consecutive-rise-scheduler** (连续上涨统计调度器)
- **功能**: 每15分钟统计币种连续上涨趋势
- **重要性**: ⭐⭐
- **作用**: 识别连续上涨的币种
- **健康检查**: 无需特殊检查

### 5. **health-monitor** (系统健康监控器)
- **功能**: 每4分钟检查系统整体健康状态
- **重要性**: ⭐⭐
- **作用**: 监控端口、数据库、API等系统组件
- **健康检查**: 验证健康状态文件是否及时更新

---

## 🚀 快速开始

### 方式1：使用启动脚本（推荐）

```bash
# 直接运行启动脚本
./start-guardian.sh
```

### 方式2：手动启动

```bash
# 使用PM2启动守护者
pm2 start process-guardian.js --name process-guardian

# 查看日志
pm2 logs process-guardian

# 查看所有进程
pm2 list
```

---

## 🌐 Web控制台

启动守护者后，访问Web控制台：

```
http://localhost:3001
```

### 控制台功能

1. **进程状态监控** - 实时查看所有进程的运行状态
2. **健康状态** - 查看每个进程的健康检查结果
3. **重启历史** - 查看每个进程的重启次数和最后重启时间
4. **告警日志** - 查看最近的异常事件和告警
5. **统计数据** - 查看守护者的运行统计

### 自动刷新

Web控制台默认每30秒自动刷新，可以通过复选框控制。

---

## 📊 监控逻辑

### 检查流程

```
每5分钟执行一次检查
    ↓
1. 检查PM2进程是否存在
    ↓
   [不存在] → 启动进程 → 记录重启
    ↓
   [存在]
    ↓
2. 检查进程是否运行中
    ↓
   [停止] → 重启进程 → 记录重启
    ↓
   [运行中]
    ↓
3. 执行健康检查（如果配置）
    ↓
   [不健康] → 重启进程 → 记录告警
    ↓
   [健康]
    ↓
✅ 检查完成
```

### 健康检查类型

1. **API检查** - 发送HTTP请求验证API响应
2. **文件检查** - 验证状态文件是否及时更新
3. **无检查** - 仅验证进程是否在运行

---

## 📁 相关文件

```
/home/user/webapp/
├── process-guardian.js          # 守护者主程序
├── start-guardian.sh            # 启动脚本
├── process-guardian.log         # 守护者日志文件
└── public/static/
    └── process-status.json      # 进程状态数据（供API使用）
```

---

## 🔧 配置说明

### 修改检查间隔

编辑 `process-guardian.js` 中的配置：

```javascript
const CONFIG = {
  checkInterval: 5 * 60 * 1000,  // 改为你想要的间隔（毫秒）
  webPort: 3001,                 // Web控制台端口
  // ...
};
```

### 添加新的监控进程

在 `CONFIG.processes` 数组中添加新配置：

```javascript
{
  name: 'your-process-name',
  description: '进程功能描述',
  command: 'node your-script.js',
  checkMethod: 'pm2',
  healthCheck: {
    type: 'api',
    url: 'http://localhost:3000/api/your-endpoint',
    expectedFields: ['field1', 'field2']
  },
  priority: 1,  // 优先级（1最高）
  restartDelay: 5000
}
```

---

## 🛠️ 常用命令

### 查看守护者状态

```bash
pm2 list
```

### 查看守护者日志

```bash
# 实时日志
pm2 logs process-guardian

# 最近50行日志
pm2 logs process-guardian --lines 50

# 不跟随日志（立即返回）
pm2 logs process-guardian --nostream
```

### 重启守护者

```bash
pm2 restart process-guardian
```

### 停止守护者

```bash
pm2 stop process-guardian
```

### 删除守护者

```bash
pm2 delete process-guardian
```

### 查看所有进程详细信息

```bash
pm2 show process-guardian
```

---

## 📈 统计数据

守护者会记录以下统计信息：

- **运行时长** - 守护者已运行的总时间
- **检查次数** - 已执行的健康检查总次数
- **重启次数** - 自动重启进程的总次数
- **失败次数** - 重启失败或健康检查失败的次数

---

## 🚨 告警级别

### ERROR（错误）
- 进程启动失败
- 进程重启失败
- 严重的系统异常

### WARNING（警告）
- 进程被自动重启
- 健康检查失败
- 进程响应异常

### SUCCESS（成功）
- 进程启动成功
- 自动恢复成功

---

## 💡 最佳实践

### 1. 持久化运行

使用PM2的保存和启动功能：

```bash
# 保存当前PM2进程列表
pm2 save

# 设置开机自启动
pm2 startup
```

### 2. 定期检查日志

```bash
# 每天检查一次守护者日志
pm2 logs process-guardian --lines 100 --nostream
```

### 3. 监控守护者本身

守护者也在PM2管理下，如果守护者崩溃，PM2会自动重启它。

### 4. 配置PM2监控

```bash
# 安装PM2监控
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔍 故障排查

### 问题1：守护者无法启动

**解决方案**:
```bash
# 检查Node.js版本
node --version  # 需要 >= 14.x

# 检查文件权限
chmod +x process-guardian.js

# 查看详细错误
pm2 logs process-guardian --err
```

### 问题2：Web控制台无法访问

**解决方案**:
```bash
# 检查端口是否被占用
lsof -i:3001

# 修改Web端口（编辑process-guardian.js）
# webPort: 3002
```

### 问题3：进程频繁重启

**解决方案**:
```bash
# 查看具体进程的日志
pm2 logs <process-name>

# 检查API是否正常
curl http://localhost:3000/api/dashboard

# 临时禁用健康检查（编辑配置移除healthCheck）
```

---

## 📞 支持

如有问题，请查看日志文件：

```bash
# 守护者日志
cat process-guardian.log

# PM2日志
pm2 logs process-guardian

# 系统日志
journalctl -u pm2-user
```

---

## 📝 更新日志

### v1.0.0 (2025-11-02)
- ✨ 初始版本
- ✅ 支持5个关键后台进程监控
- ✅ Web控制台界面
- ✅ 自动重启机制
- ✅ 健康检查功能
- ✅ 告警日志系统

---

**最后更新**: 2025-11-02  
**作者**: AI Assistant  
**版本**: 1.0.0
