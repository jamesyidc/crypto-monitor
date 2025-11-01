# 数据库访问控制规则

## 🔒 K线数据库（kline_data表）访问规则

### ✅ 允许写入的API（使用 `KlineService`）

1. **POST `/api/kline/sync`** - 同步K线数据
2. **POST `/api/kline/sync48h/all`** - 批量补全48小时数据
3. **POST `/api/kline/sync48h/:symbol`** - 单币种补全48小时数据

### 🔍 只读API（使用 `ReadOnlyKlineService`）

1. **GET `/api/kline/:symbol`** - 查询单个币种K线数据
2. **GET `/api/kline/:symbol/indicators`** - 查询带技术指标的K线数据
3. **GET `/api/kline/:symbol/multi`** - 批量查询K线数据
4. **POST `/api/backtest/convergence-trading`** - 单币种回测
5. **POST `/api/backtest/batch-all`** - 批量回测
6. 所有其他读取K线数据的API

## 📝 开发规范

### 规则1：K线数据写入控制

```typescript
// ❌ 错误：在非K线同步API中使用 KlineService
app.post('/api/some-business-logic', async (c) => {
  const klineService = new KlineService(c.env.DB); // 有写入权限
  // ...
});

// ✅ 正确：使用 ReadOnlyKlineService
app.post('/api/some-business-logic', async (c) => {
  const { ReadOnlyKlineService } = await import('./services/ReadOnlyKlineService');
  const klineService = new ReadOnlyKlineService(c.env.DB); // 只读
  // ...
});
```

### 规则2：错误提示

如果尝试通过 `ReadOnlyKlineService` 写入数据，会抛出错误：

```
🔒 安全错误：K线数据库只读！请使用 KlineService 进行数据同步。当前服务：ReadOnlyKlineService
```

### 规则3：代码审查

提交代码前检查：
- [ ] 所有非K线同步的API使用 `ReadOnlyKlineService`
- [ ] 只有K线同步API使用 `KlineService`
- [ ] 没有直接使用 `c.env.DB` 写入 `kline_data` 表

## 🛡️ 安全保障

1. **编译时检查**：TypeScript类型系统确保只读服务不能调用写入方法
2. **运行时检查**：任何尝试调用写入方法都会立即抛出错误
3. **代码审查**：通过文档明确规定访问规则

## 📅 更新日志

- **2025-10-29**: 创建K线数据库访问控制规则
- **2025-10-29**: 实现 `ReadOnlyKlineService` 只读服务
- **2025-10-29**: 更新批量回测API使用只读服务
