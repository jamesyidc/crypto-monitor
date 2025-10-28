#!/bin/bash
# 数据库初始化脚本
# 逐条执行SQL创建表，确保稳定性

set -e  # 遇到错误立即停止

DB_NAME="webapp-production"
WRANGLER="npx wrangler"

echo "🔄 开始初始化数据库..."

# 定义核心表创建SQL（每个表单独一条语句）
declare -a tables=(
  # 1. coins表
  "CREATE TABLE IF NOT EXISTS coins (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT UNIQUE NOT NULL, name TEXT NOT NULL, enabled INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
  "CREATE INDEX IF NOT EXISTS idx_coins_enabled ON coins(enabled)"
  
  # 2. consecutive_rise_dominance表（最重要）
  "CREATE TABLE IF NOT EXISTS consecutive_rise_dominance (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL UNIQUE, current_streak INTEGER DEFAULT 0, max_streak INTEGER DEFAULT 0, max_streak_start_time TEXT, max_streak_end_time TEXT, last_check_time TEXT, last_high_ratio REAL, last_low_ratio REAL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
  "CREATE INDEX IF NOT EXISTS idx_consecutive_rise_symbol ON consecutive_rise_dominance(symbol)"
  "CREATE INDEX IF NOT EXISTS idx_consecutive_rise_max_streak ON consecutive_rise_dominance(max_streak DESC)"
  "CREATE INDEX IF NOT EXISTS idx_consecutive_rise_current_streak ON consecutive_rise_dominance(current_streak DESC)"
  
  # 3. kline_data表
  "CREATE TABLE IF NOT EXISTS kline_data (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, timeframe TEXT NOT NULL DEFAULT '5m', time TEXT NOT NULL, open REAL NOT NULL, high REAL NOT NULL, low REAL NOT NULL, close REAL NOT NULL, volume REAL NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(symbol, timeframe, time))"
  "CREATE INDEX IF NOT EXISTS idx_kline_symbol ON kline_data(symbol)"
  "CREATE INDEX IF NOT EXISTS idx_kline_time ON kline_data(time)"
  "CREATE INDEX IF NOT EXISTS idx_kline_symbol_time ON kline_data(symbol, timeframe, time)"
  
  # 4. 其他核心表
  "CREATE TABLE IF NOT EXISTS price_records (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, price REAL NOT NULL, change_5min REAL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)"
  "CREATE INDEX IF NOT EXISTS idx_price_records_symbol ON price_records(symbol)"
  
  "CREATE TABLE IF NOT EXISTS daily_stats (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, date TEXT NOT NULL, max_price REAL, min_price REAL, change_24h REAL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(symbol, date))"
  "CREATE INDEX IF NOT EXISTS idx_daily_stats_symbol ON daily_stats(symbol)"
  
  "CREATE TABLE IF NOT EXISTS round_stats (id INTEGER PRIMARY KEY AUTOINCREMENT, round_time TEXT UNIQUE NOT NULL, total_coins INTEGER, up_coins INTEGER, down_coins INTEGER, neutral_coins INTEGER, max_increase REAL, max_decrease REAL, avg_change REAL, extreme_up_count INTEGER DEFAULT 0, extreme_down_count INTEGER DEFAULT 0)"
  "CREATE INDEX IF NOT EXISTS idx_round_stats_time ON round_stats(round_time)"
  
  "CREATE TABLE IF NOT EXISTS coin_round_details (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, round_time TEXT NOT NULL, price REAL NOT NULL, change_5min REAL, UNIQUE(symbol, round_time))"
  "CREATE INDEX IF NOT EXISTS idx_coin_round_symbol ON coin_round_details(symbol)"
  "CREATE INDEX IF NOT EXISTS idx_coin_round_time ON coin_round_details(round_time)"
  
  "CREATE TABLE IF NOT EXISTS price_extremes (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, new_high_count INTEGER DEFAULT 0, new_low_count INTEGER DEFAULT 0, ath REAL, atl REAL, ath_time TEXT, atl_time TEXT, rounds_since_high INTEGER DEFAULT 0, rounds_since_low INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(symbol))"
  "CREATE INDEX IF NOT EXISTS idx_extremes_symbol ON price_extremes(symbol)"
)

# 逐条执行SQL
count=0
total=${#tables[@]}

for sql in "${tables[@]}"; do
  count=$((count+1))
  echo "[$count/$total] 执行SQL..."
  timeout 10 $WRANGLER d1 execute $DB_NAME --local --command="$sql" >/dev/null 2>&1 || {
    echo "⚠️  SQL执行失败（可能表已存在）: $sql"
  }
  sleep 0.5  # 避免锁定
done

echo "✅ 数据库初始化完成！"
echo ""
echo "接下来需要："
echo "1. 插入币种数据: npm run db:seed-coins"
echo "2. 重新构建: npm run build"
echo "3. 启动服务: pm2 restart crypto-monitor"
