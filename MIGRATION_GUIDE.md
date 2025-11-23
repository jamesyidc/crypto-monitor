# Database Migration Guide

## Auto-Trading Configuration Migrations

Two migrations need to be applied to enable auto-trading configuration:

### Migration 0050: Add Auto Trading Config Columns
### Migration 0051: Add Single Trade Limit Column

## Option 1: Using Wrangler CLI (Recommended)

### Prerequisites
- Wrangler CLI installed
- Authenticated with Cloudflare (`wrangler login`)

### Commands

```bash
# Apply migration 0050
npx wrangler d1 execute crypto-monitor-db --remote \
  --file=migrations/0050_add_auto_trading_config.sql

# Apply migration 0051
npx wrangler d1 execute crypto-monitor-db --remote \
  --file=migrations/0051_add_single_trade_limit.sql
```

## Option 2: Using Cloudflare Dashboard

1. Go to Cloudflare Dashboard
2. Navigate to **Workers & Pages** > **D1**
3. Select database: `crypto-monitor-db`
4. Go to **Console** tab
5. Copy and paste the SQL from each migration file and execute

### Migration 0050 SQL:

```sql
-- Add auto-trading configuration columns to simulated_accounts table

ALTER TABLE simulated_accounts ADD COLUMN max_position_value REAL DEFAULT NULL;
ALTER TABLE simulated_accounts ADD COLUMN position_splits INTEGER DEFAULT 1 CHECK(position_splits >= 1 AND position_splits <= 10);
ALTER TABLE simulated_accounts ADD COLUMN force_protection_balance REAL DEFAULT NULL;
ALTER TABLE simulated_accounts ADD COLUMN auto_trading_enabled INTEGER DEFAULT 0 CHECK(auto_trading_enabled IN (0, 1));
ALTER TABLE simulated_accounts ADD COLUMN protection_triggered INTEGER DEFAULT 0 CHECK(protection_triggered IN (0, 1));
```

### Migration 0051 SQL:

```sql
-- Add single trade limit column to simulated_accounts table

ALTER TABLE simulated_accounts ADD COLUMN single_trade_limit REAL DEFAULT NULL;
```

## Option 3: Using Local Wrangler (If you have wrangler.toml configured)

```bash
cd /path/to/crypto-monitor

# Apply to remote database
npx wrangler d1 execute crypto-monitor-db --remote \
  --file=migrations/0050_add_auto_trading_config.sql

npx wrangler d1 execute crypto-monitor-db --remote \
  --file=migrations/0051_add_single_trade_limit.sql

# Or apply to local database for testing
npx wrangler d1 execute crypto-monitor-db --local \
  --file=migrations/0050_add_auto_trading_config.sql

npx wrangler d1 execute crypto-monitor-db --local \
  --file=migrations/0051_add_single_trade_limit.sql
```

## Verification

After applying migrations, verify with:

```sql
-- Check if columns exist
PRAGMA table_info(simulated_accounts);
```

Expected new columns:
- `max_position_value` (REAL)
- `single_trade_limit` (REAL)
- `position_splits` (INTEGER, default 1)
- `force_protection_balance` (REAL)
- `auto_trading_enabled` (INTEGER, default 0)
- `protection_triggered` (INTEGER, default 0)

## Troubleshooting

### Error: "no such column: max_position_value"
- **Cause**: Migration 0050 not applied
- **Solution**: Apply migration 0050 using one of the methods above

### Error: "no such column: single_trade_limit"
- **Cause**: Migration 0051 not applied
- **Solution**: Apply migration 0051 using one of the methods above

### Error: "table simulated_accounts has no column named..."
- **Cause**: One or both migrations not applied
- **Solution**: Apply both migrations in order (0050 first, then 0051)

## Rollback (if needed)

To rollback these migrations:

```sql
-- Rollback migration 0051
ALTER TABLE simulated_accounts DROP COLUMN single_trade_limit;

-- Rollback migration 0050
ALTER TABLE simulated_accounts DROP COLUMN max_position_value;
ALTER TABLE simulated_accounts DROP COLUMN position_splits;
ALTER TABLE simulated_accounts DROP COLUMN force_protection_balance;
ALTER TABLE simulated_accounts DROP COLUMN auto_trading_enabled;
ALTER TABLE simulated_accounts DROP COLUMN protection_triggered;
```

Note: SQLite doesn't support `DROP COLUMN` in all versions. If you get an error, you'll need to:
1. Create a new table without those columns
2. Copy data from old table
3. Drop old table
4. Rename new table

## Contact

If you encounter issues applying these migrations, please contact the development team.
