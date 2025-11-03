# 策略选择器升级 - 从勾选框到下拉选择

## 📋 修改概述

将模拟交易回测配置中的"交易策略"选择方式从**勾选框(checkbox)**升级为**下拉选择+新增按钮**的方式。

---

## 🎯 需求背景

### 问题
原来的勾选框方式存在以下限制：
1. ❌ 策略固定，无法动态扩展
2. ❌ 无法与策略信号库同步
3. ❌ 用户体验不够灵活

### 解决方案
改为下拉选择+添加按钮的方式：
1. ✅ 支持添加多个策略
2. ✅ 可以与策略信号库同步
3. ✅ 更灵活的策略管理

---

## 🔄 修改内容

### 1. **HTML界面修改** (`public/trading.html`)

#### 修改前（第303-321行）
```html
<!-- 策略选择 -->
<div class="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded">
    <label class="block text-sm font-bold text-gray-800 mb-3">
        <i class="fas fa-brain mr-2"></i>交易策略 <span class="text-red-500">*</span>
    </label>
    <div class="space-y-2">
        <label class="flex items-center space-x-3 cursor-pointer hover:bg-blue-100 p-2 rounded">
            <input type="checkbox" name="strategy" value="convergence" checked>
            <span class="text-sm text-gray-700">震荡收敛策略（5根K线内≥2次震荡收敛）</span>
        </label>
        <label class="flex items-center space-x-3 cursor-pointer hover:bg-blue-100 p-2 rounded">
            <input type="checkbox" name="strategy" value="peak">
            <span class="text-sm text-gray-700">波段高点策略（RSI>65 且 涨幅≤0.1%）</span>
        </label>
    </div>
    <p class="text-xs text-gray-500 mt-2">提示：可以多选策略组合使用</p>
</div>
```

#### 修改后
```html
<!-- 策略选择 -->
<div class="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded">
    <div class="flex items-center justify-between mb-3">
        <label class="text-sm font-bold text-gray-800">
            <i class="fas fa-brain mr-2"></i>交易策略 <span class="text-red-500">*</span>
        </label>
        <button type="button" id="addStrategyBtn" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition">
            <i class="fas fa-plus mr-1"></i>添加策略
        </button>
    </div>
    
    <!-- 已选策略列表 -->
    <div id="selectedStrategiesList" class="space-y-2 mb-3">
        <!-- 默认策略 -->
        <div class="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
            <div class="flex items-center space-x-2">
                <i class="fas fa-check-circle text-green-500"></i>
                <span class="text-sm text-gray-700">震荡收敛策略（5根K线内≥2次震荡收敛）</span>
            </div>
            <button type="button" onclick="removeStrategy('default-convergence')" class="text-red-500 hover:text-red-700 text-xs">
                <i class="fas fa-times"></i>
            </button>
            <input type="hidden" name="strategy" value="convergence">
        </div>
    </div>
    
    <!-- 添加策略下拉框（隐藏状态） -->
    <div id="strategyDropdownContainer" class="hidden mt-3 p-3 bg-white border border-blue-300 rounded">
        <label class="block text-xs font-medium text-gray-700 mb-2">
            从策略信号库中选择：
        </label>
        <select id="strategySelector" class="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2">
            <option value="">-- 请选择策略 --</option>
            <optgroup label="买入策略">
                <option value="convergence">震荡收敛策略（5根K线内≥2次震荡收敛）</option>
                <option value="custom_buy_1">自定义买入策略 1</option>
            </optgroup>
            <optgroup label="卖出策略">
                <option value="peak">波段高点策略（RSI>65 且 涨幅≤0.1%）</option>
                <option value="custom_sell_1">自定义卖出策略 1</option>
            </optgroup>
        </select>
        <div class="flex gap-2">
            <button type="button" id="confirmAddStrategy" class="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded">
                <i class="fas fa-check mr-1"></i>确认添加
            </button>
            <button type="button" id="cancelAddStrategy" class="flex-1 bg-gray-400 hover:bg-gray-500 text-white text-xs px-3 py-1 rounded">
                <i class="fas fa-times mr-1"></i>取消
            </button>
        </div>
    </div>
    
    <p class="text-xs text-gray-500 mt-2">提示：可以添加多个策略组合使用，策略来自<a href="/pattern.html" target="_blank" class="text-blue-600 hover:underline">特征库</a></p>
</div>
```

---

### 2. **JavaScript逻辑添加** (`public/static/trading-v2.js`)

#### 新增全局变量
```javascript
let selectedStrategies = new Map(); // 存储已选策略
let strategyCounter = 0; // 策略计数器

// 策略库（从API动态加载）
let strategyLibrary = {
  'convergence': { name: '震荡收敛策略（5根K线内≥2次震荡收敛）', type: 'buy' },
  'peak': { name: '波段高点策略（RSI>65 且 涨幅≤0.1%）', type: 'sell' },
  'custom_buy_1': { name: '自定义买入策略 1', type: 'buy' },
  'custom_sell_1': { name: '自定义卖出策略 1', type: 'sell' }
};
```

#### 新增函数
1. `loadStrategyLibrary()` - 从API加载策略库
2. `initializeStrategies()` - 初始化默认策略
3. `updateStrategySelector()` - 更新下拉框选项
4. `showStrategyDropdown()` - 显示添加策略面板
5. `hideStrategyDropdown()` - 隐藏添加策略面板
6. `confirmAddStrategy()` - 确认添加选中的策略
7. `removeStrategy(strategyId)` - 移除指定策略
8. `renderSelectedStrategies()` - 渲染已选策略列表

---

## 🎨 用户体验改进

### 操作流程

```
1. 用户打开回测配置弹窗
   ↓
2. 看到默认已选的"震荡收敛策略"
   ↓
3. 点击"添加策略"按钮
   ↓
4. 弹出下拉选择框，显示策略库中的策略（分组：买入策略/卖出策略）
   ↓
5. 选择一个策略
   ↓
6. 点击"确认添加"
   ↓
7. 策略添加到已选列表，下拉框自动隐藏
   ↓
8. 可以继续添加更多策略，或删除不需要的策略
   ↓
9. 提交回测配置
```

### 界面特点

- ✅ **已选策略列表**: 清晰显示所有已选策略
- ✅ **删除按钮**: 每个策略旁边有❌按钮，可以快速删除
- ✅ **分组显示**: 下拉框中策略按"买入/卖出"分组
- ✅ **动态更新**: 已选策略不会再出现在下拉框中
- ✅ **链接跳转**: 提示文字中有链接可跳转到特征库

---

## 🔌 API对接（待实现）

### 策略库API

```javascript
// TODO: 对接真实的策略库API
async function loadStrategyLibrary() {
  const response = await axios.get('/api/strategy-library');
  strategyLibrary = response.data.strategies;
  updateStrategySelector();
}
```

### 策略数据结构

```javascript
{
  "strategies": {
    "convergence": {
      "name": "震荡收敛策略（5根K线内≥2次震荡收敛）",
      "type": "buy",
      "description": "检测5根K线内出现至少2次震荡收敛信号",
      "parameters": {
        "window": 5,
        "minConvergences": 2
      }
    },
    "peak": {
      "name": "波段高点策略（RSI>65 且 涨幅≤0.1%）",
      "type": "sell",
      "description": "当RSI指标大于65且涨幅小于等于0.1%时卖出",
      "parameters": {
        "rsiThreshold": 65,
        "changeThreshold": 0.1
      }
    }
  }
}
```

---

## 📊 数据流

### 前端 → 后端

提交回测配置时，策略数据仍然以字符串数组形式传递：

```javascript
{
  "strategies": ["convergence", "peak", "custom_buy_1"],
  "timeframe": "5m",
  "limit": 500,
  "leverage": 10,
  // ...其他配置
}
```

### 后端兼容性

后端API无需修改，仍然接收`strategies`数组参数，处理方式保持不变。

---

## 🧪 测试要点

### 功能测试
1. ✅ 打开回测配置弹窗，检查默认策略是否显示
2. ✅ 点击"添加策略"按钮，下拉框是否显示
3. ✅ 选择策略后点击"确认添加"，策略是否添加到列表
4. ✅ 已添加的策略是否不再出现在下拉框中
5. ✅ 点击策略的❌按钮，策略是否被移除
6. ✅ 点击"取消"按钮，下拉框是否隐藏
7. ✅ 提交回测配置，检查请求数据中策略数组是否正确

### 边界测试
1. ✅ 删除所有策略后，列表是否显示提示文字
2. ✅ 不选择任何策略时提交，是否有错误提示
3. ✅ 添加多个相同类型的策略，是否正常工作

---

## 🔮 未来扩展

### 与特征库对接
将策略库数据从特征库API实时获取，实现：
- 动态同步最新策略
- 支持用户自定义策略
- 显示策略详细参数
- 策略版本管理

### 高级功能
- 策略参数自定义
- 策略预览和说明
- 策略推荐（基于历史表现）
- 策略组合模板

---

## 📝 文件清单

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `public/trading.html` | 修改 | 更新策略选择UI（第303-321行） |
| `public/static/trading-v2.js` | 修改 | 添加策略管理功能（前21行） |

---

## ✅ 提交信息

```
feat: 升级策略选择器为下拉式+添加按钮

- 将回测配置中的策略选择从勾选框改为下拉选择
- 支持动态添加/删除多个策略
- 策略按买入/卖出分组显示
- 已选策略自动从下拉框中移除
- 为后续对接策略信号库预留接口
- 提升用户体验和界面灵活性

修改文件：
- public/trading.html
- public/static/trading-v2.js
```

---

**修改完成时间**: 2025-11-02  
**修改人**: AI Assistant  
**版本**: 1.0.0
