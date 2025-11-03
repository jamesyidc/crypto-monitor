# Troubleshooting: Price Type Error

## ❌ Error Message

```
D1_ERROR: no such column: entry_price_type: SQLITE_ERROR
```

## 🔍 Root Cause

The database schema is missing the new columns for price type selection. This happens when:
- Migration 0046 has not been applied to the production database
- The columns `entry_price_type`, `exit_price_type`, `entry_specified_price`, `exit_specified_price` don't exist in the `trading_strategies` table

## ✅ Solution

Apply migration 0046 to add the required columns to the database.

### Method 1: Use Standalone Script (Fastest)

```bash
cd /home/user/webapp
./apply-migration-0046.sh
```

This script will:
1. Apply migration 0046 to production database
2. Verify the new columns are added
3. Show confirmation message

### Method 2: Use Complete Migration Script

```bash
cd /home/user/webapp
./apply-new-migrations.sh
```

This script will apply all migrations including 0046 (migrations 0043, 0044, 0045, 0046).

### Method 3: Manual Migration (Using Wrangler CLI)

```bash
cd /home/user/webapp
wrangler d1 execute crypto-trading-db --remote --file=migrations/0046_add_price_type_to_strategies.sql
```

### Method 4: Manual SQL (If you prefer direct SQL)

Connect to your D1 database and run:

```sql
-- Add entry price type fields
ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited' 
  CHECK(entry_price_type IN ('unlimited', 'open', 'close', 'high', 'low', 'specified'));
ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;

-- Add exit price type fields
ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited'
  CHECK(exit_price_type IN ('unlimited', 'open', 'close', 'high', 'low', 'specified'));
ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_strategies_entry_price_type ON trading_strategies(entry_price_type);
CREATE INDEX IF NOT EXISTS idx_strategies_exit_price_type ON trading_strategies(exit_price_type);
```

## 📋 Step-by-Step Resolution

### Step 1: Verify Current Database Schema

Check if the columns exist:

```bash
wrangler d1 execute crypto-trading-db --remote --command "PRAGMA table_info(trading_strategies);"
```

Look for these columns in the output:
- `entry_price_type`
- `exit_price_type`
- `entry_specified_price`
- `exit_specified_price`

### Step 2: Apply Migration

Choose one of the methods above to apply the migration.

**Recommended**: Use Method 1 (standalone script)

```bash
./apply-migration-0046.sh
```

### Step 3: Verify Migration Applied

Check that the columns now exist:

```bash
wrangler d1 execute crypto-trading-db --remote --command "PRAGMA table_info(trading_strategies);" | grep -E "entry_price_type|exit_price_type|entry_specified_price|exit_specified_price"
```

Expected output should show 4 lines with the new column names.

### Step 4: Test in Browser

1. **Clear browser cache** (optional but recommended)
2. **Refresh the page** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
3. **Navigate to Strategy Library** (策略库)
4. **Create or edit a strategy**
5. **Select price types** from the dropdowns
6. **Save strategy** - should work without error

## 🧪 Verification Checklist

After applying the migration, verify these work:

- [ ] Create new strategy with "无限制" price type ✅
- [ ] Create new strategy with "开盘价" entry price ✅
- [ ] Create new strategy with "收盘价" exit price ✅
- [ ] Create new strategy with "指定价格" and enter custom price ✅
- [ ] Edit existing strategy to change price types ✅
- [ ] View strategy card - price type displays correctly ✅
- [ ] No more "no such column" errors ✅

## 🚨 Common Issues and Solutions

### Issue 1: "Column already exists" error

**Symptom**: Error message says column already exists

**Solution**: Migration was already applied. No action needed. The error is likely elsewhere.

```bash
# Check if columns exist
wrangler d1 execute crypto-trading-db --remote --command "SELECT entry_price_type, exit_price_type FROM trading_strategies LIMIT 1;"
```

### Issue 2: Migration script permission denied

**Symptom**: `bash: ./apply-migration-0046.sh: Permission denied`

**Solution**: Make script executable

```bash
chmod +x apply-migration-0046.sh
./apply-migration-0046.sh
```

### Issue 3: Wrangler command not found

**Symptom**: `wrangler: command not found`

**Solution**: Install Wrangler CLI

```bash
npm install -g wrangler
# Or use npx
npx wrangler d1 execute crypto-trading-db --remote --file=migrations/0046_add_price_type_to_strategies.sql
```

### Issue 4: Database connection timeout

**Symptom**: Request times out when applying migration

**Solution**: 
1. Check internet connection
2. Verify Cloudflare account credentials
3. Try again after a few minutes
4. Use Cloudflare dashboard to check database status

### Issue 5: Still getting error after migration

**Symptom**: Error persists even after successful migration

**Solution**:
1. **Hard refresh browser** (Ctrl+Shift+F5)
2. **Clear browser cache**
3. **Clear Cloudflare cache** (if using caching)
4. **Redeploy worker** to ensure latest code is live:
   ```bash
   npm run deploy
   # or
   wrangler deploy
   ```
5. **Check browser console** for any JavaScript errors
6. **Verify columns exist** in database (see Step 1 above)

## 📊 Database Schema After Migration

The `trading_strategies` table should include these new columns:

| Column Name | Type | Default | Constraint | Description |
|-------------|------|---------|------------|-------------|
| `entry_price_type` | TEXT | 'unlimited' | CHECK (in list) | Entry price execution type |
| `entry_specified_price` | REAL | NULL | - | Custom entry price (if specified) |
| `exit_price_type` | TEXT | 'unlimited' | CHECK (in list) | Exit price execution type |
| `exit_specified_price` | REAL | NULL | - | Custom exit price (if specified) |

Valid values for `entry_price_type` and `exit_price_type`:
- `'unlimited'` - Execute immediately
- `'open'` - Execute at open price
- `'close'` - Execute at close price
- `'high'` - Execute at high price
- `'low'` - Execute at low price
- `'specified'` - Execute at custom price

## 🔄 Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove price type columns
ALTER TABLE trading_strategies DROP COLUMN entry_price_type;
ALTER TABLE trading_strategies DROP COLUMN entry_specified_price;
ALTER TABLE trading_strategies DROP COLUMN exit_price_type;
ALTER TABLE trading_strategies DROP COLUMN exit_specified_price;

-- Remove indexes
DROP INDEX IF EXISTS idx_strategies_entry_price_type;
DROP INDEX IF EXISTS idx_strategies_exit_price_type;
```

**Note**: SQLite in D1 may not support `DROP COLUMN`. In that case, you would need to:
1. Create a new table without the columns
2. Copy data from old table
3. Drop old table
4. Rename new table

## 📞 Need Help?

If you continue to experience issues:

1. **Check migration file exists**: `ls -la migrations/0046_add_price_type_to_strategies.sql`
2. **Check migration content**: `cat migrations/0046_add_price_type_to_strategies.sql`
3. **Check database logs** in Cloudflare dashboard
4. **Check worker logs** for any API errors
5. **Test with browser DevTools** open to see network requests

## ✅ Success Indicators

You'll know the migration succeeded when:

1. ✅ Script shows "✅ 迁移 0046 应用成功！"
2. ✅ Column verification shows 4 new columns
3. ✅ Creating/editing strategy with price types works
4. ✅ No "no such column" errors
5. ✅ Strategy cards display price type information
6. ✅ Specified price input shows/hides correctly

## 📚 Related Documentation

- [PRICE_TYPE_FEATURE.md](./PRICE_TYPE_FEATURE.md) - Complete feature documentation
- [QUICK_DEPLOYMENT_GUIDE.md](./QUICK_DEPLOYMENT_GUIDE.md) - Deployment instructions
- [migrations/0046_add_price_type_to_strategies.sql](./migrations/0046_add_price_type_to_strategies.sql) - Migration SQL

## 🎯 Summary

**Problem**: Database missing price type columns
**Solution**: Apply migration 0046
**Command**: `./apply-migration-0046.sh`
**Result**: Price type selection feature works correctly

After applying the migration, users can select price types when creating or editing trading strategies without encountering the "no such column" error.
