# Price Type Selection Feature

## 📋 Overview

The **Price Type Selection** feature allows users to specify at what price to execute entry (buy) and exit (sell) trades when creating trading strategies. This gives users fine-grained control over trade execution timing and price points.

## 🎯 User Request

> "策略里面还要新增加 选择买点价格： 无限制 指定价格 开盘价 收盘价 最高价 最低单价 卖点价格：无限制 指定价格 开盘价 收盘价 最高价 最低单价"

Translation: "Need to add to strategy: Entry price selection: Unlimited, Specified Price, Open Price, Close Price, High Price, Low Price. Exit price selection: Unlimited, Specified Price, Open Price, Close Price, High Price, Low Price"

## ✨ Features

### 1. Price Type Options

Both entry and exit points support 6 price type options:

| Option | Value | Description | Use Case |
|--------|-------|-------------|----------|
| 无限制 | `unlimited` | No price restriction, execute immediately when signal triggers | Default behavior, fastest execution |
| 开盘价 | `open` | Execute at K-line open price | Start of period execution |
| 收盘价 | `close` | Execute at K-line close price | End of period confirmation |
| 最高价 | `high` | Execute at K-line high price | Capture peak prices |
| 最低价 | `low` | Execute at K-line low price | Capture bottom prices |
| 指定价格 | `specified` | Execute only when price reaches user-defined value | Precise price targeting |

### 2. Dynamic UI

- **Entry Price Type Dropdown**: Located in "买点配置" (Entry Point Configuration) section
- **Exit Price Type Dropdown**: Located in "卖点配置" (Exit Point Configuration) section
- **Conditional Specified Price Inputs**: 
  - Hidden by default
  - Automatically shown when "指定价格" is selected
  - Accepts decimal numbers with step 0.01
  - Includes helpful description text

### 3. Database Schema

New columns added to `trading_strategies` table:

```sql
-- Entry price configuration
entry_price_type TEXT DEFAULT 'unlimited' 
  CHECK(entry_price_type IN ('unlimited', 'open', 'close', 'high', 'low', 'specified'))
entry_specified_price REAL

-- Exit price configuration  
exit_price_type TEXT DEFAULT 'unlimited'
  CHECK(exit_price_type IN ('unlimited', 'open', 'close', 'high', 'low', 'specified'))
exit_specified_price REAL
```

## 🔧 Implementation Details

### Frontend Changes (pattern.html)

#### 1. HTML Structure

**Entry Price Type Selector** (lines 663-682):
```html
<div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
        买点价格类型
        <i class="fas fa-info-circle text-gray-400 ml-1" title="选择以什么价格买入"></i>
    </label>
    <select id="entryPriceType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
        <option value="unlimited">无限制</option>
        <option value="open">开盘价</option>
        <option value="close">收盘价</option>
        <option value="high">最高价</option>
        <option value="low">最低价</option>
        <option value="specified">指定价格</option>
    </select>
</div>
<div id="entrySpecifiedPriceContainer" class="mt-4 hidden">
    <label class="block text-sm font-medium text-gray-700 mb-2">指定买入价格</label>
    <input type="number" id="entrySpecifiedPrice" step="0.01" placeholder="例如: 50000" 
           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
    <p class="text-xs text-gray-500 mt-1">仅当触发买点信号且价格达到指定值时才买入</p>
</div>
```

**Exit Price Type Selector** (lines 718-737):
```html
<div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
        卖点价格类型
        <i class="fas fa-info-circle text-gray-400 ml-1" title="选择以什么价格卖出"></i>
    </label>
    <select id="exitPriceType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
        <option value="unlimited">无限制</option>
        <option value="open">开盘价</option>
        <option value="close">收盘价</option>
        <option value="high">最高价</option>
        <option value="low">最低价</option>
        <option value="specified">指定价格</option>
    </select>
</div>
<div id="exitSpecifiedPriceContainer" class="mt-4 hidden">
    <label class="block text-sm font-medium text-gray-700 mb-2">指定卖出价格</label>
    <input type="number" id="exitSpecifiedPrice" step="0.01" placeholder="例如: 60000" 
           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
    <p class="text-xs text-gray-500 mt-1">仅当触发卖点信号且价格达到指定值时才卖出</p>
</div>
```

#### 2. JavaScript Event Listeners

**Entry Price Type Change Handler**:
```javascript
if (document.getElementById('entryPriceType')) {
    document.getElementById('entryPriceType').addEventListener('change', function(e) {
        const priceType = e.target.value;
        const specifiedContainer = document.getElementById('entrySpecifiedPriceContainer');
        
        if (priceType === 'specified') {
            specifiedContainer.classList.remove('hidden');
        } else {
            specifiedContainer.classList.add('hidden');
            document.getElementById('entrySpecifiedPrice').value = '';
        }
    });
}
```

**Exit Price Type Change Handler**:
```javascript
if (document.getElementById('exitPriceType')) {
    document.getElementById('exitPriceType').addEventListener('change', function(e) {
        const priceType = e.target.value;
        const specifiedContainer = document.getElementById('exitSpecifiedPriceContainer');
        
        if (priceType === 'specified') {
            specifiedContainer.classList.remove('hidden');
        } else {
            specifiedContainer.classList.add('hidden');
            document.getElementById('exitSpecifiedPrice').value = '';
        }
    });
}
```

#### 3. Strategy Form Data Collection

**saveStrategy() Function Enhancement**:
```javascript
// Collect price type configuration
const entryPriceType = document.getElementById('entryPriceType').value;
const exitPriceType = document.getElementById('exitPriceType').value;
const entrySpecifiedPrice = entryPriceType === 'specified' ? 
    (document.getElementById('entrySpecifiedPrice').value ? parseFloat(document.getElementById('entrySpecifiedPrice').value) : null) : null;
const exitSpecifiedPrice = exitPriceType === 'specified' ? 
    (document.getElementById('exitSpecifiedPrice').value ? parseFloat(document.getElementById('exitSpecifiedPrice').value) : null) : null;

const strategyData = {
    // ... other fields
    entry_price_type: entryPriceType,
    entry_specified_price: entrySpecifiedPrice,
    exit_price_type: exitPriceType,
    exit_specified_price: exitSpecifiedPrice,
    // ... other fields
};
```

#### 4. Strategy Edit Data Population

**editStrategy() Function Enhancement**:
```javascript
// Populate entry price type
document.getElementById('entryPriceType').value = strategy.entry_price_type || 'unlimited';
if (strategy.entry_price_type === 'specified' && strategy.entry_specified_price) {
    document.getElementById('entrySpecifiedPrice').value = strategy.entry_specified_price;
    document.getElementById('entrySpecifiedPriceContainer').classList.remove('hidden');
} else {
    document.getElementById('entrySpecifiedPriceContainer').classList.add('hidden');
}

// Populate exit price type
document.getElementById('exitPriceType').value = strategy.exit_price_type || 'unlimited';
if (strategy.exit_price_type === 'specified' && strategy.exit_specified_price) {
    document.getElementById('exitSpecifiedPrice').value = strategy.exit_specified_price;
    document.getElementById('exitSpecifiedPriceContainer').classList.remove('hidden');
} else {
    document.getElementById('exitSpecifiedPriceContainer').classList.add('hidden');
}
```

#### 5. Strategy Display Card Enhancement

**renderStrategyCards() Function Enhancement**:
```javascript
// Entry point display with price type
${(() => {
    const priceTypeMap = {
        'unlimited': '无限制',
        'open': '开盘价',
        'close': '收盘价',
        'high': '最高价',
        'low': '最低价',
        'specified': '指定价格'
    };
    const priceType = priceTypeMap[strategy.entry_price_type] || '无限制';
    const priceDisplay = strategy.entry_price_type === 'specified' && strategy.entry_specified_price 
        ? `${priceType}: ${strategy.entry_specified_price}`
        : priceType;
    return `<p class="text-xs text-green-700 mt-1"><i class="fas fa-dollar-sign mr-1"></i>${priceDisplay}</p>`;
})()}

// Exit point display with price type (similar structure)
```

### Backend Changes (src/index.tsx)

#### 1. POST /api/strategies Endpoint

**SQL INSERT Statement**:
```typescript
INSERT INTO trading_strategies (
  strategy_name, strategy_type, priority,
  entry_signal_type, entry_signal_keyword, entry_signal_category, entry_signal_template,
  entry_price_type, entry_specified_price,  // 🆕 New fields
  exit_signal_type, exit_signal_keyword, exit_signal_category, exit_signal_template,
  exit_price_type, exit_specified_price,    // 🆕 New fields
  exit_signals_json, allowed_coin_levels, include_historical_levels,
  daily_gain_condition_operator, daily_gain_condition_value,
  position_splits, split_interval_pct, max_holding_periods,
  stop_loss_pct, take_profit_pct, max_position_size,
  is_enabled, description
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**Parameter Binding**:
```typescript
.bind(
  data.strategy_name, data.strategy_type, data.priority || 'medium',
  data.entry_signal_type || null, data.entry_signal_keyword || null, 
  data.entry_signal_category || null, data.entry_signal_template || null,
  data.entry_price_type || 'unlimited', data.entry_specified_price || null,  // 🆕
  data.exit_signal_type || null, data.exit_signal_keyword || null, 
  data.exit_signal_category || null, data.exit_signal_template || null,
  data.exit_price_type || 'unlimited', data.exit_specified_price || null,    // 🆕
  // ... other parameters
)
```

#### 2. PUT /api/strategies/:id Endpoint

**Dynamic Field Updates**:
```typescript
// Entry price type fields
if (data.entry_price_type !== undefined) {
  fields.push('entry_price_type = ?');
  values.push(data.entry_price_type);
}
if (data.entry_specified_price !== undefined) {
  fields.push('entry_specified_price = ?');
  values.push(data.entry_specified_price);
}

// Exit price type fields
if (data.exit_price_type !== undefined) {
  fields.push('exit_price_type = ?');
  values.push(data.exit_price_type);
}
if (data.exit_specified_price !== undefined) {
  fields.push('exit_specified_price = ?');
  values.push(data.exit_specified_price);
}
```

### Database Migration (0046)

**File**: `migrations/0046_add_price_type_to_strategies.sql`

```sql
-- Add entry price type fields
ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited' 
  CHECK(entry_price_type IN ('unlimited', 'open', 'close', 'high', 'low', 'specified'));
ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;

-- Add exit price type fields
ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited'
  CHECK(exit_price_type IN ('unlimited', 'open', 'close', 'high', 'low', 'specified'));
ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;

-- Create indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_strategies_entry_price_type ON trading_strategies(entry_price_type);
CREATE INDEX IF NOT EXISTS idx_strategies_exit_price_type ON trading_strategies(exit_price_type);
```

## 📖 User Guide

### Creating a Strategy with Price Types

1. **Navigate to Strategy Library**: Click on "策略库" tab

2. **Create New Strategy**: Click "创建新策略" button

3. **Configure Entry Point**:
   - Select entry signal from "买点信号类型" dropdown
   - Choose "买点价格类型" from the new dropdown:
     - For immediate execution: Select "无限制"
     - For specific K-line price: Select "开盘价", "收盘价", "最高价", or "最低价"
     - For custom price: Select "指定价格" and enter price in the input field that appears

4. **Configure Exit Point**:
   - Select exit signal(s) from "卖点信号类型" dropdown(s)
   - Choose "卖点价格类型" from the new dropdown
   - Same options as entry point

5. **Save Strategy**: Click "保存策略" to save with price type configuration

### Editing an Existing Strategy

1. **Open Strategy**: Click edit button (pencil icon) on strategy card

2. **View Current Price Types**: Price types are pre-populated in dropdowns

3. **Modify Price Types**: Change selections as needed

4. **Update Strategy**: Click "保存策略" to save changes

### Viewing Strategy Price Types

Strategy cards now display price type information:

**Entry Point Section (Green)**:
- Shows signal type
- Shows price type with dollar sign icon (💲)
- If specified price: shows "指定价格: 50000"

**Exit Point Section (Red)**:
- Shows signal type(s)
- Shows price type with dollar sign icon (💲)
- If specified price: shows "指定价格: 60000"

## 🧪 Testing

### Test Cases

1. **Create Strategy with Unlimited Price Type** (Default)
   - Expected: Strategy saves with entry_price_type='unlimited', exit_price_type='unlimited'
   - Display: Shows "无限制" in strategy card

2. **Create Strategy with Open/Close/High/Low Price**
   - Expected: Strategy saves with selected price type
   - Display: Shows corresponding Chinese label in strategy card

3. **Create Strategy with Specified Price**
   - Expected: Specified price input appears
   - Expected: Strategy saves with entry_price_type='specified' and entry_specified_price value
   - Display: Shows "指定价格: [value]" in strategy card

4. **Edit Strategy to Change Price Type**
   - Expected: Dropdowns show current values
   - Expected: Changing to 'specified' shows price input
   - Expected: Changing from 'specified' hides price input and clears value
   - Expected: Updated strategy saves new price types

5. **Backward Compatibility**
   - Expected: Existing strategies without price type fields display as "无限制"
   - Expected: Editing old strategies allows adding price types

## 🚀 Deployment Steps

1. **Apply Migration**:
   ```bash
   ./apply-new-migrations.sh
   # Or manually run migration 0046
   ```

2. **Deploy Updated Code**:
   ```bash
   npm run deploy
   # Or wrangler deploy
   ```

3. **Test in Production**:
   - Create test strategy with each price type option
   - Verify specified price input shows/hides correctly
   - Edit existing strategy and verify price types are preserved

## 🔄 Backward Compatibility

- ✅ Existing strategies automatically default to 'unlimited' price type
- ✅ No breaking changes to existing functionality
- ✅ All existing strategies continue to work as before
- ✅ Users can optionally add price types to existing strategies by editing them

## 📝 Future Enhancements

Potential future improvements:

1. **Price Range Selection**: Allow users to specify a price range (e.g., buy between 48000-52000)
2. **Price Offset**: Allow users to specify offset from signal price (e.g., buy 2% below signal price)
3. **Time Window**: Combine price type with time window (e.g., execute at close price within 1 hour)
4. **Price Type Strategy Statistics**: Track which price types perform best
5. **Conditional Price Logic**: More complex price conditions (e.g., buy at low if daily change < -5%)

## 🎉 Summary

The Price Type Selection feature provides users with granular control over trade execution prices, enhancing the flexibility and precision of trading strategies. With support for 6 price types and conditional specified price inputs, users can now create more sophisticated trading strategies that execute at optimal price points.
