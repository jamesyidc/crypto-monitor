#!/usr/bin/env node

/**
 * 首页数据快照调度器
 * 每10分钟保存一次完整的首页数据
 */

import Database from 'better-sqlite3';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  interval: 10 * 60 * 1000, // 10分钟
  apiUrl: 'http://localhost:3000',
  dbPath: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite'
};

// 数据库连接
let db = null;

/**
 * 初始化数据库连接
 */
function initDatabase() {
  try {
    const dbFullPath = path.join(__dirname, CONFIG.dbPath);
    db = new Database(dbFullPath);
    console.log(`[${new Date().toISOString()}] 数据库连接成功: ${dbFullPath}`);
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 数据库连接失败:`, error.message);
    return false;
  }
}

/**
 * 获取首页数据
 */
async function fetchDashboardData() {
  try {
    const response = await axios.get(`${CONFIG.apiUrl}/api/dashboard`, {
      timeout: 120000  // 增加到2分钟
    });
    return response.data;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 获取dashboard数据失败:`, error.message);
    return null;
  }
}

/**
 * 获取比价数据
 */
async function fetchCompareData() {
  try {
    const response = await axios.get(`${CONFIG.apiUrl}/api/compare`, {
      timeout: 120000  // 增加到2分钟
    });
    return response.data;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 获取compare数据失败:`, error.message);
    return null;
  }
}

/**
 * 获取北京时间
 */
function getBeijingTime() {
  const now = new Date();
  // 转换为北京时间 (UTC+8)
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime;
}

/**
 * 格式化北京时间为字符串 (YYYY/MM/DD HH:mm:ss)
 */
function formatBeijingTime(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  
  return `${year}/${month}/${day} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
}

/**
 * 保存快照到数据库 - 每个币种一条记录
 */
function saveSnapshot(dashboardData, compareData) {
  try {
    const beijingTime = getBeijingTime();
    const snapshotTime = formatBeijingTime(beijingTime);
    
    // 提取北京时间的日期和时间部分
    const year = beijingTime.getUTCFullYear();
    const month = beijingTime.getUTCMonth() + 1;
    const day = beijingTime.getUTCDate();
    const snapshotDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const snapshotHour = beijingTime.getUTCHours();
    const snapshotMinute = beijingTime.getUTCMinutes();

    // 准备插入语句
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO dashboard_snapshots (
        snapshot_time, snapshot_date, snapshot_hour, snapshot_minute,
        rank_num, symbol, prev_round_change, this_round_price,
        today_surge_count, today_crash_count, today_change_percent,
        extreme_up_4_count, extreme_down_3_count, today_v1_count,
        update_time, all_time_high, ath_time, price_drop_from_ath,
        change_24h, rank_24h, priority_level, highest_ratio, lowest_ratio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let savedCount = 0;
    let errors = [];

    // 遍历每个币种并保存数据
    if (dashboardData.coinDetails && Array.isArray(dashboardData.coinDetails)) {
      dashboardData.coinDetails.forEach((coin, index) => {
        try {
          // 1. 序号 (rank_num) - 使用索引+1
          const rankNum = index + 1;

          // 2. 币名 (symbol)
          const symbol = coin.symbol;

          // 3. 上轮涨跌 (prev_round_change) - 从 change_vs_prev_round
          const prevRoundChange = coin.change_vs_prev_round || 0;

          // 4-6. 当天急涨/急跌/V1次数 - 从 todayStats 查找
          const todayStat = dashboardData.todayStats?.find(s => s.symbol === symbol);
          const todaySurgeCount = todayStat?.total_surges || 0;
          const todayCrashCount = todayStat?.total_crashes || 0;
          const todayV1Count = coin.today_v1_count || 0;

          // 7-8. +4%/-3% 极端行情次数 - 从 extremes 查找
          const extreme = dashboardData.extremes?.find(e => e.symbol === symbol);
          const extremeUp4Count = extreme?.extreme_up_count || 0;
          const extremeDown3Count = extreme?.extreme_down_count || 0;

          // 9. 当天涨幅 (today_change_percent)
          const todayChangePercent = coin.change_percent || 0;

          // 10. 更新时间 (update_time) - 使用当前快照时间
          const updateTime = snapshotTime;

          // 11-13. 历史高价相关 - 从 extremes 查找
          const allTimeHigh = extreme?.all_time_high || null;
          const athTime = extreme?.ath_date || null;
          
          // 计算现价跌幅 (price_drop_from_ath)
          let priceDropFromAth = null;
          if (allTimeHigh && coin.price && allTimeHigh > 0) {
            priceDropFromAth = ((coin.price - allTimeHigh) / allTimeHigh * 100);
          }

          // 14. 24h涨幅 (change_24h)
          const change24h = coin.change_24h || 0;

          // 15. 24h排行 (rank_24h) - 从 compareData 中获取
          let rank24h = null;
          if (compareData && compareData.coinDetails) {
            const compareIndex = compareData.coinDetails.findIndex(c => c.symbol === symbol);
            rank24h = compareIndex >= 0 ? compareIndex + 1 : null;
          }

          // 16. 优先级 (priority_level) - 从 priorities 查找（字段名是 level）
          const priority = dashboardData.priorities?.find(p => p.symbol === symbol);
          const priorityLevel = priority?.level || null;

          // 17. 这轮价格 (this_round_price)
          const thisRoundPrice = coin.price || 0;

          // 18-19. 最高占比/最低占比 - 从 priorities 查找（不是extremes）
          const highestRatio = priority?.high_ratio || null;
          const lowestRatio = priority?.low_ratio || null;

          // 插入数据
          stmt.run(
            snapshotTime,
            snapshotDate,
            snapshotHour,
            snapshotMinute,
            rankNum,
            symbol,
            prevRoundChange,
            thisRoundPrice,
            todaySurgeCount,
            todayCrashCount,
            todayChangePercent,
            extremeUp4Count,
            extremeDown3Count,
            todayV1Count,
            updateTime,
            allTimeHigh,
            athTime,
            priceDropFromAth,
            change24h,
            rank24h,
            priorityLevel,
            highestRatio,
            lowestRatio
          );

          savedCount++;
        } catch (coinError) {
          errors.push(`${coin.symbol}: ${coinError.message}`);
        }
      });
    }

    if (errors.length > 0) {
      console.log(`[${formatBeijingTime(beijingTime)}] ⚠️  部分币种保存失败:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }

    // 💾 保存聚合统计数据
    try {
      const aggStmt = db.prepare(`
        INSERT OR REPLACE INTO snapshot_aggregates (
          snapshot_time, snapshot_date,
          change24h_over10_up, change24h_over10_down,
          today_new_high_count, today_new_low_count,
          average_change, green_count, red_count, green_ratio,
          surge_count, crash_count, risk_alert_count,
          today_total_surges, today_total_crashes,
          surge_crash_diff, surge_crash_ratio,
          market_trend, market_trend_stars,
          distance_to_high, distance_to_low
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 提取聚合数据
      const specialStats = dashboardData.specialStats || {};
      const latestRound = dashboardData.latestRound || {};
      
      // 计算今日累计急涨急跌
      let todayTotalSurges = 0;
      let todayTotalCrashes = 0;
      let distanceToHigh = 0;
      let distanceToLow = 0;
      
      if (dashboardData.todayStats && Array.isArray(dashboardData.todayStats)) {
        dashboardData.todayStats.forEach(stat => {
          todayTotalSurges += (stat.total_surges || 0);
          todayTotalCrashes += (stat.total_crashes || 0);
          distanceToHigh += (stat.new_high_count || 0);
          distanceToLow += (stat.new_low_count || 0);
        });
      }

      const surgeCrashDiff = todayTotalSurges - todayTotalCrashes;
      const surgeCrashRatio = todayTotalCrashes > 0 ? todayTotalSurges / todayTotalCrashes : 0;

      // 计算市场趋势（与首页逻辑一致）
      let marketTrend = '无序震荡';
      let marketTrendStars = '';
      
      const change24hOver10Down = specialStats.change24hOver10Down || 0;
      if (change24hOver10Down >= 3) {
        marketTrend = '单边主跌';
        marketTrendStars = '☆☆☆';
      } else if (todayTotalSurges >= 10) {
        const diff = surgeCrashDiff;
        const ratio = todayTotalCrashes > 0 ? diff / todayTotalCrashes : diff;
        
        if (distanceToHigh - distanceToLow >= 3) {
          marketTrend = '单边主升';
        } else if (distanceToHigh - distanceToLow >= 1) {
          marketTrend = '震荡偏多';
        }
        
        const starCount = ratio >= 3 ? 3 : (ratio >= 2 ? 2 : (ratio >= 1 ? 1 : 0));
        marketTrendStars = '★'.repeat(starCount);
        
      } else if (todayTotalCrashes >= 10) {
        const diff = todayTotalCrashes - todayTotalSurges;
        const ratio = todayTotalSurges > 0 ? diff / todayTotalSurges : diff;
        
        if (distanceToLow - distanceToHigh >= 3) {
          marketTrend = '单边主跌';
        } else if (distanceToLow - distanceToHigh >= 1) {
          marketTrend = '震荡偏空';
        }
        
        const starCount = ratio >= 3 ? 3 : (ratio >= 2 ? 2 : (ratio >= 1 ? 1 : 0));
        marketTrendStars = '☆'.repeat(starCount);
      }

      aggStmt.run(
        snapshotTime,
        snapshotDate,
        specialStats.change24hOver10Up || 0,
        specialStats.change24hOver10Down || 0,
        specialStats.todayNewHighCount || 0,
        specialStats.todayNewLowCount || 0,
        latestRound.average_change || 0,
        latestRound.green_count || 0,
        latestRound.red_count || 0,
        latestRound.green_ratio || 0,
        latestRound.surge_count || 0,
        latestRound.crash_count || 0,
        latestRound.risk_alert_count || 0,
        todayTotalSurges,
        todayTotalCrashes,
        surgeCrashDiff,
        surgeCrashRatio,
        marketTrend,
        marketTrendStars,
        distanceToHigh,
        distanceToLow
      );
      
      console.log(`   - 聚合统计已保存`);
    } catch (aggError) {
      console.error(`   ⚠️ 聚合统计保存失败:`, aggError.message);
    }

    console.log(`[${formatBeijingTime(beijingTime)}] ✅ 快照已保存: ${snapshotTime}`);
    console.log(`   - 成功保存 ${savedCount} 个币种的数据`);
    console.log(`   - 快照时间: ${snapshotDate} ${snapshotHour.toString().padStart(2, '0')}:${snapshotMinute.toString().padStart(2, '0')}`);
    
    return savedCount > 0;
  } catch (error) {
    console.error(`[${formatBeijingTime(getBeijingTime())}] ❌ 保存快照失败:`, error.message);
    console.error('   错误详情:', error.stack);
    return false;
  }
}

/**
 * 执行快照任务
 */
async function takeSnapshot() {
  const beijingTime = getBeijingTime();
  console.log(`[${formatBeijingTime(beijingTime)}] 🔄 开始获取数据快照...`);

  // 获取首页数据
  const dashboardData = await fetchDashboardData();
  if (!dashboardData) {
    console.error(`[${formatBeijingTime(getBeijingTime())}] ❌ 无法获取dashboard数据，跳过本次快照`);
    return false;
  }

  // 获取比价数据
  const compareData = await fetchCompareData();
  if (!compareData) {
    console.error(`[${formatBeijingTime(getBeijingTime())}] ❌ 无法获取compare数据，跳过本次快照`);
    return false;
  }

  // 保存快照
  return saveSnapshot(dashboardData, compareData);
}

/**
 * 清理旧快照（保留最近7天）
 */
function cleanOldSnapshots() {
  try {
    const beijingTime = getBeijingTime();
    const sevenDaysAgo = new Date(beijingTime.getTime() - (7 * 24 * 60 * 60 * 1000));
    const year = sevenDaysAgo.getUTCFullYear();
    const month = (sevenDaysAgo.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = sevenDaysAgo.getUTCDate().toString().padStart(2, '0');
    const cutoffDate = `${year}-${month}-${day}`;

    const stmt = db.prepare('DELETE FROM dashboard_snapshots WHERE snapshot_date < ?');
    const result = stmt.run(cutoffDate);

    if (result.changes > 0) {
      console.log(`[${formatBeijingTime(beijingTime)}] 🧹 已清理 ${result.changes} 条旧快照（早于 ${cutoffDate}）`);
    }
  } catch (error) {
    console.error(`[${formatBeijingTime(getBeijingTime())}] 清理旧快照失败:`, error.message);
  }
}

/**
 * 计算下一个快照时间点
 * 在每小时的 :00:10, :10:10, :20:10, :30:10, :40:10, :50:10 执行
 * (比首页刷新晚10秒)
 * 使用北京时间计算
 */
function getNextSnapshotTime() {
  const beijingTime = getBeijingTime();
  const currentMinute = beijingTime.getUTCMinutes();
  const currentSecond = beijingTime.getUTCSeconds();
  
  // 目标分钟数（0, 10, 20, 30, 40, 50）
  const targetMinutes = [0, 10, 20, 30, 40, 50];
  
  // 找到下一个目标分钟
  let nextMinute = null;
  for (const minute of targetMinutes) {
    if (currentMinute < minute || (currentMinute === minute && currentSecond < 10)) {
      nextMinute = minute;
      break;
    }
  }
  
  // 如果没找到，说明需要到下一个小时
  // 注意：nextTime 是 UTC 时间，但我们根据北京时间计算偏移
  const nextTime = new Date(beijingTime);
  if (nextMinute === null) {
    nextTime.setUTCHours(nextTime.getUTCHours() + 1);
    nextTime.setUTCMinutes(0);
  } else {
    nextTime.setUTCMinutes(nextMinute);
  }
  nextTime.setUTCSeconds(10); // 在第10秒执行
  nextTime.setUTCMilliseconds(0);
  
  // 转换回真实时间（减去8小时偏移）
  const realNextTime = new Date(nextTime.getTime() - (8 * 60 * 60 * 1000));
  
  return realNextTime;
}

/**
 * 计算距离下次快照的延迟时间（毫秒）
 */
function getDelayToNextSnapshot() {
  const nextTime = getNextSnapshotTime();
  const now = new Date();
  const delay = nextTime.getTime() - now.getTime();
  return { delay, nextTime };
}

/**
 * 调度下一次快照
 */
function scheduleNextSnapshot() {
  const { delay, nextTime } = getDelayToNextSnapshot();
  const beijingNextTime = new Date(nextTime.getTime() + (8 * 60 * 60 * 1000));
  
  console.log(`[${formatBeijingTime(getBeijingTime())}] ⏰ 下次快照时间: ${formatBeijingTime(beijingNextTime)} (${Math.round(delay / 1000)}秒后)`);
  
  setTimeout(async () => {
    await takeSnapshot();
    scheduleNextSnapshot(); // 递归调度下一次
  }, delay);
}

/**
 * 启动调度器
 */
async function startScheduler() {
  const beijingTime = getBeijingTime();
  console.log('========================================');
  console.log(`[${formatBeijingTime(beijingTime)}] 📸 首页数据快照调度器启动`);
  console.log(`[${formatBeijingTime(beijingTime)}] ⏰ 执行时间: 每小时 :00:10, :10:10, :20:10, :30:10, :40:10, :50:10`);
  console.log(`[${formatBeijingTime(beijingTime)}] 🕐 时区: Asia/Shanghai (北京时间)`);
  console.log(`[${formatBeijingTime(beijingTime)}] 📡 延迟策略: 比首页刷新晚10秒`);
  console.log(`[${formatBeijingTime(beijingTime)}] 🌐 API: ${CONFIG.apiUrl}`);
  console.log('========================================');

  // 初始化数据库
  if (!initDatabase()) {
    console.error('数据库初始化失败，退出程序');
    process.exit(1);
  }

  // 检查当前时间是否恰好在快照时间点（允许5秒误差）
  const currentMinute = beijingTime.getUTCMinutes();
  const currentSecond = beijingTime.getUTCSeconds();
  const targetMinutes = [0, 10, 20, 30, 40, 50];
  const isSnapshotTime = targetMinutes.includes(currentMinute) && currentSecond >= 10 && currentSecond <= 15;
  
  if (isSnapshotTime) {
    console.log(`[${formatBeijingTime(beijingTime)}] ✅ 当前时间恰好是快照时间点，立即执行第一次快照`);
    await takeSnapshot();
  } else {
    console.log(`[${formatBeijingTime(beijingTime)}] ⏭️ 跳过立即执行，等待下一个快照时间点`);
  }

  // 每24小时清理一次旧数据（在北京时间凌晨3点执行）
  const scheduleCleanup = () => {
    const now = new Date();
    const beijingNow = getBeijingTime();
    
    // 计算下一个北京时间凌晨3点
    const nextCleanupBeijing = new Date(beijingNow);
    if (beijingNow.getUTCHours() >= 3) {
      // 如果已过今天3点，设置为明天3点
      nextCleanupBeijing.setUTCDate(nextCleanupBeijing.getUTCDate() + 1);
    }
    nextCleanupBeijing.setUTCHours(3, 0, 0, 0);
    
    // 转换为真实UTC时间
    const nextCleanupReal = new Date(nextCleanupBeijing.getTime() - (8 * 60 * 60 * 1000));
    const delay = nextCleanupReal.getTime() - now.getTime();
    
    setTimeout(() => {
      cleanOldSnapshots();
      scheduleCleanup(); // 递归调度下一次清理
    }, delay);
    
    console.log(`[${formatBeijingTime(beijingNow)}] 🧹 下次清理旧数据: ${formatBeijingTime(nextCleanupBeijing)}`);
  };
  scheduleCleanup();

  // 开始调度快照任务
  scheduleNextSnapshot();

  console.log(`[${formatBeijingTime(getBeijingTime())}] ✅ 调度器运行中`);
}

/**
 * 优雅退出
 */
process.on('SIGINT', () => {
  console.log(`\n[${formatBeijingTime(getBeijingTime())}] 收到退出信号，正在关闭...`);
  if (db) {
    db.close();
    console.log(`[${formatBeijingTime(getBeijingTime())}] 数据库连接已关闭`);
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n[${formatBeijingTime(getBeijingTime())}] 收到终止信号，正在关闭...`);
  if (db) {
    db.close();
    console.log(`[${formatBeijingTime(getBeijingTime())}] 数据库连接已关闭`);
  }
  process.exit(0);
});

// 启动调度器
startScheduler().catch((error) => {
  console.error(`[${formatBeijingTime(getBeijingTime())}] 调度器启动失败:`, error);
  process.exit(1);
});
