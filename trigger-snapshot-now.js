#!/usr/bin/env node

/**
 * Manually trigger a snapshot NOW (for testing)
 */

import axios from 'axios';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  apiUrl: 'http://localhost:3000',
  dbPath: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite'
};

/**
 * 获取北京时间
 */
function getBeijingTime() {
  const now = new Date();
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

async function triggerSnapshot() {
  try {
    console.log('🔄 Fetching dashboard data...');
    const dashboardRes = await axios.get(`${CONFIG.apiUrl}/api/dashboard`, { timeout: 120000 });
    const dashboardData = dashboardRes.data;
    
    console.log('🔄 Fetching compare data...');
    const compareRes = await axios.get(`${CONFIG.apiUrl}/api/compare`, { timeout: 120000 });
    const compareData = compareRes.data;
    
    console.log('💾 Saving snapshot to database...');
    
    const dbFullPath = path.join(__dirname, CONFIG.dbPath);
    const db = new Database(dbFullPath);
    
    const beijingTime = getBeijingTime();
    const snapshotTime = formatBeijingTime(beijingTime);
    
    const year = beijingTime.getUTCFullYear();
    const month = beijingTime.getUTCMonth() + 1;
    const day = beijingTime.getUTCDate();
    const snapshotDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const snapshotHour = beijingTime.getUTCHours();
    const snapshotMinute = beijingTime.getUTCMinutes();
    
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
    
    if (dashboardData.coinDetails && Array.isArray(dashboardData.coinDetails)) {
      dashboardData.coinDetails.forEach((coin, index) => {
        const rankNum = index + 1;
        const symbol = coin.symbol;
        const prevRoundChange = coin.change_vs_prev_round || 0;
        
        const todayStat = dashboardData.todayStats?.find(s => s.symbol === symbol);
        const todaySurgeCount = todayStat?.total_surges || 0;
        const todayCrashCount = todayStat?.total_crashes || 0;
        const todayV1Count = coin.today_v1_count || 0;
        
        const extreme = dashboardData.extremes?.find(e => e.symbol === symbol);
        const extremeUp4Count = extreme?.extreme_up_count || 0;
        const extremeDown3Count = extreme?.extreme_down_count || 0;
        
        const todayChangePercent = coin.change_percent || 0;
        const updateTime = snapshotTime;
        
        const allTimeHigh = extreme?.all_time_high || null;
        const athTime = extreme?.ath_date || null;
        
        let priceDropFromAth = null;
        if (allTimeHigh && coin.price && allTimeHigh > 0) {
          priceDropFromAth = ((coin.price - allTimeHigh) / allTimeHigh * 100);
        }
        
        const change24h = coin.change_24h || 0;
        
        let rank24h = null;
        if (compareData && compareData.coinDetails) {
          const compareIndex = compareData.coinDetails.findIndex(c => c.symbol === symbol);
          rank24h = compareIndex >= 0 ? compareIndex + 1 : null;
        }
        
        const priority = dashboardData.priorities?.find(p => p.symbol === symbol);
        const priorityLevel = priority?.level || null;
        
        const thisRoundPrice = coin.price || 0;
        const highestRatio = priority?.high_ratio || null;
        const lowestRatio = priority?.low_ratio || null;
        
        stmt.run(
          snapshotTime, snapshotDate, snapshotHour, snapshotMinute,
          rankNum, symbol, prevRoundChange, thisRoundPrice,
          todaySurgeCount, todayCrashCount, todayChangePercent,
          extremeUp4Count, extremeDown3Count, todayV1Count,
          updateTime, allTimeHigh, athTime, priceDropFromAth,
          change24h, rank24h, priorityLevel, highestRatio, lowestRatio
        );
        
        savedCount++;
      });
    }
    
    // Save aggregate stats
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
    
    const specialStats = dashboardData.specialStats || {};
    const latestRound = dashboardData.latestRound || {};
    
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
      snapshotTime, snapshotDate,
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
    
    db.close();
    
    console.log(`✅ Snapshot saved successfully!`);
    console.log(`   Time: ${snapshotTime}`);
    console.log(`   Date: ${snapshotDate}`);
    console.log(`   Coins: ${savedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

triggerSnapshot();
