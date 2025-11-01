# 📇 版本快速参考卡片

```
┌─────────────────────────────────────────────────────────────┐
│  🎉 v1.3.0 - 当天统计面板功能完整版                         │
│                                                             │
│  📅 发布日期: 2025-10-29                                     │
│  🏷️  Git标签: v1.3.0-daily-stats                            │
│  📦 Git提交: 3eeef13                                         │
│                                                             │
│  ✨ 核心功能:                                                │
│  ├─ 📊 当天统计面板（4项指标）                               │
│  ├─ 🐛 详细调试日志                                          │
│  ├─ 📊 18币种数据导入                                        │
│  ├─ ⏰ 时间逻辑优化（1小时缓冲）                             │
│  └─ ✅ 统计一致性修复                                        │
│                                                             │
│  🐛 Bug修复:                                                 │
│  ├─ forEach循环结构错误                                     │
│  ├─ 时间过滤逻辑                                            │
│  └─ 统计数据不一致                                          │
│                                                             │
│  📝 文档:                                                    │
│  ├─ VERSION.md (9.5K)         - 完整版本历史                │
│  ├─ RELEASE_v1.3.0.md (9.6K)  - 详细发布说明                │
│  ├─ CHANGELOG.md (4.4K)       - 更新日志                    │
│  └─ DEBUG_GUIDE.md (4.4K)     - 调试指南                    │
│                                                             │
│  💾 完整备份: webapp_v1.3.0_daily_stats_complete.tar.gz     │
│  📏 备份大小: 3.86 MB                                        │
│  🔗 下载链接:                                                │
│     https://page.gensparksite.com/project_backups/         │
│     webapp_v1.3.0_daily_stats_complete.tar.gz               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速命令

### 版本管理
```bash
# 查看当前版本
git log --oneline -1

# 查看所有标签
git tag -l

# 切换到v1.3.0
git checkout v1.3.0-daily-stats

# 查看版本差异
git diff v1.2.0..v1.3.0
```

### 服务管理
```bash
# 重新构建
npm run build

# 重启服务
pm2 restart crypto-monitor

# 查看日志
pm2 logs --nostream --lines 50

# 查看状态
pm2 list
```

### 数据导入
```bash
# 导入18币种数据
npx wrangler d1 execute webapp-production --local \
  --file=import_surge_crash_data.sql

# 修复统计不一致
npx wrangler d1 execute webapp-production --local \
  --file=fix_daily_stats_extreme_counts.sql
```

### 版本回退
```bash
# 回退到v1.2.0
git reset --hard before-daily-stats
npm run build
pm2 restart crypto-monitor

# 恢复到v1.3.0
git reset --hard v1.3.0-daily-stats
npm run build
pm2 restart crypto-monitor
```

---

## 📊 统计面板指标

| 指标         | 阈值       | 颜色 | 说明                     |
|--------------|------------|------|--------------------------|
| 起涨触发     | > +2%      | 🟢   | 20根累计涨幅             |
| 起跌触发     | < -2% 🧪   | 🔴   | 20根累计跌幅（测试值）   |
| 最长连续上涨 | 占比上涨>下跌 | 🟢   | 含结束时间               |
| 最长连续下跌 | 占比下跌>上涨 | 🔴   | 含结束时间               |

**注**: 🧪 = 测试阈值，原本为-3%

---

## 🔧 调试技巧

### 浏览器控制台
```javascript
// 查看统计计算过程
🔍 计算当天统计，目标日期: 2025/10/29
📊 当天数据条数: 68 / 总数: 300

// 查看累计涨跌幅详情
📊 累计涨跌幅详情（共48个数据点）:
   最小值: -2.45%  ← 如果 > -2%，起跌触发为0是正常的
   最大值: +3.87%
   起涨点(>2%): 1个
   起跌点(<-2%): 0个

// 查看累计跌幅最大的时间点
📉 累计跌幅最大的5个时间点:
   2025/10/29 08:30: -2.45%
   2025/10/29 09:15: -2.12%
   ...
```

### 常见问题快速诊断
```bash
# 统计面板不显示？
# → 查看控制台是否有 "当天数据不足20根" 提示

# 起跌触发次数为0？
# → 查看控制台 "最小值" 是否大于-2%

# 时间显示为"-"？
# → 正常，说明没有连续上涨/下跌的情况
```

---

## 📞 快速参考

| 问题               | 查看文档           | 执行命令                      |
|--------------------|-------------------|------------------------------|
| 完整版本历史       | VERSION.md        | -                            |
| 发布说明           | RELEASE_v1.3.0.md | -                            |
| 更新日志           | CHANGELOG.md      | -                            |
| 调试指南           | DEBUG_GUIDE.md    | F12 打开浏览器控制台         |
| 服务状态           | -                 | `pm2 list`                   |
| 服务日志           | -                 | `pm2 logs --nostream`        |
| 数据库查询         | -                 | `npx wrangler d1 execute`    |
| 项目备份           | -                 | 下载 tar.gz 备份文件         |

---

## 🎯 关键文件位置

```
webapp/
├── VERSION.md                    # 完整版本历史（9.5K）
├── RELEASE_v1.3.0.md             # 发布说明（9.6K）
├── CHANGELOG.md                  # 更新日志（4.4K）
├── DEBUG_GUIDE.md                # 调试指南（4.4K）
├── VERSION_CARD.md               # 本文件 - 快速参考
├── README.md                     # 项目文档（已更新）
├── import_surge_crash_data.sql   # 数据导入脚本
├── fix_daily_stats_extreme_counts.sql  # 统计修复脚本
├── public/
│   ├── kline.html                # K线页面（含统计面板）
│   └── static/
│       └── kline.js              # K线脚本（含统计逻辑）
└── src/
    └── services/
        └── coinService.ts        # 币种服务（含时间逻辑）
```

---

## 📅 版本时间线

```
2025-10-25  v1.0.0  初始版本
    ↓
2025-10-26  v1.1.0  K线等级分组
    ↓
2025-10-27  v1.2.0  数据手动修改
    ↓
2025-10-29  v1.3.0  当天统计面板 ← 当前版本
```

---

**维护者**: AI Assistant  
**创建日期**: 2025-10-29  
**最后更新**: 2025-10-29
