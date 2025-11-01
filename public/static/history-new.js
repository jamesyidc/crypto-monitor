// 全局状态
let availableDates = [];
let availableTimes = [];
let currentSnapshot = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadAvailableDates();
    
    // 绑定事件
    document.getElementById('dateSelector').addEventListener('change', onDateChange);
    document.getElementById('timeSelector').addEventListener('change', onTimeChange);
    document.getElementById('loadSnapshotBtn').addEventListener('click', loadSnapshot);
});

/**
 * 加载可用的日期列表
 */
async function loadAvailableDates() {
    try {
        const response = await axios.get('/api/snapshots/dates');
        
        if (response.data.success) {
            availableDates = response.data.dates;
            
            const dateSelector = document.getElementById('dateSelector');
            dateSelector.innerHTML = '<option value="">请选择日期</option>';
            
            if (availableDates.length === 0) {
                dateSelector.innerHTML = '<option value="">暂无历史数据</option>';
                return;
            }
            
            availableDates.forEach(date => {
                const option = document.createElement('option');
                option.value = date;
                option.textContent = formatDate(date);
                dateSelector.appendChild(option);
            });
            
            // 默认选择第一个日期（最新的）
            if (availableDates.length > 0) {
                dateSelector.value = availableDates[0];
                onDateChange();
            }
        } else {
            console.error('加载日期失败:', response.data.error);
            alert('加载日期失败: ' + response.data.error);
        }
    } catch (error) {
        console.error('加载日期失败:', error);
        alert('加载日期失败，请刷新页面重试');
    }
}

/**
 * 日期变更事件
 */
async function onDateChange() {
    const dateSelector = document.getElementById('dateSelector');
    const selectedDate = dateSelector.value;
    
    if (!selectedDate) {
        const timeSelector = document.getElementById('timeSelector');
        timeSelector.disabled = true;
        timeSelector.innerHTML = '<option value="">请先选择日期</option>';
        document.getElementById('loadSnapshotBtn').disabled = true;
        return;
    }
    
    // 加载该日期的时间列表
    await loadAvailableTimes(selectedDate);
}

/**
 * 加载指定日期的时间列表
 */
async function loadAvailableTimes(date) {
    try {
        const response = await axios.get('/api/snapshots/times', {
            params: { date }
        });
        
        if (response.data.success) {
            availableTimes = response.data.snapshots;
            
            const timeSelector = document.getElementById('timeSelector');
            timeSelector.disabled = false;
            timeSelector.innerHTML = '<option value="">请选择时间</option>';
            
            if (availableTimes.length === 0) {
                timeSelector.innerHTML = '<option value="">该日期无数据</option>';
                timeSelector.disabled = true;
                document.getElementById('loadSnapshotBtn').disabled = true;
                return;
            }
            
            availableTimes.forEach(snapshot => {
                const option = document.createElement('option');
                option.value = snapshot.snapshot_time; // 使用 snapshot_time 作为值
                
                const coinCount = snapshot.coins ? snapshot.coins.length : 0;
                option.textContent = `${snapshot.snapshot_time} - ${coinCount}个币种`;
                timeSelector.appendChild(option);
            });
            
            // 默认选择第一个时间（最新的）
            if (availableTimes.length > 0) {
                timeSelector.value = availableTimes[0].snapshot_time;
                onTimeChange();
            }
        } else {
            console.error('加载时间失败:', response.data.error);
            alert('加载时间失败: ' + response.data.error);
        }
    } catch (error) {
        console.error('加载时间失败:', error);
        alert('加载时间失败，请刷新页面重试');
    }
}

/**
 * 时间变更事件
 */
function onTimeChange() {
    const timeSelector = document.getElementById('timeSelector');
    const loadBtn = document.getElementById('loadSnapshotBtn');
    
    loadBtn.disabled = !timeSelector.value;
}

/**
 * 加载快照数据
 */
async function loadSnapshot() {
    const snapshotTime = document.getElementById('timeSelector').value;
    
    if (!snapshotTime) {
        alert('请先选择日期和时间');
        return;
    }
    
    // 显示加载状态
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('snapshotContent').classList.add('hidden');
    
    try {
        // 从 availableTimes 中找到选中的快照数据（避免再次请求）
        const selectedSnapshot = availableTimes.find(s => s.snapshot_time === snapshotTime);
        
        if (selectedSnapshot && selectedSnapshot.coins) {
            currentSnapshot = selectedSnapshot;
            renderSnapshot(currentSnapshot);
            
            // 隐藏加载状态，显示内容
            document.getElementById('loadingState').classList.add('hidden');
            document.getElementById('snapshotContent').classList.remove('hidden');
            
            // 滚动到内容区域
            document.getElementById('snapshotContent').scrollIntoView({ behavior: 'smooth' });
        } else {
            throw new Error('快照数据不存在');
        }
    } catch (error) {
        console.error('加载快照失败:', error);
        alert('加载快照失败: ' + error.message);
        document.getElementById('loadingState').classList.add('hidden');
    }
}

/**
 * 渲染快照数据（新结构：每个币种一条记录）
 */
function renderSnapshot(snapshot) {
    // 快照信息
    document.getElementById('snapshotInfo').textContent = 
        `${snapshot.snapshot_time} 的数据快照`;
    
    // 🆕 渲染聚合统计数据
    if (snapshot.aggregate) {
        renderAggregateStats(snapshot.aggregate);
    }
    
    // 渲染币种表格（新结构）
    renderCoinTable(snapshot.coins);
}

/**
 * 渲染聚合统计数据
 */
function renderAggregateStats(agg) {
    const totalCoins = 29;
    
    // 今日重点统计
    document.getElementById('change24hOver10Up').textContent = agg.change24h_over10_up || 0;
    const up10Percent = totalCoins > 0 ? ((agg.change24h_over10_up / totalCoins) * 100).toFixed(1) : '0.0';
    document.getElementById('change24hOver10UpPercent').textContent = up10Percent + '%';
    
    document.getElementById('change24hOver10Down').textContent = agg.change24h_over10_down || 0;
    const down10Percent = totalCoins > 0 ? ((agg.change24h_over10_down / totalCoins) * 100).toFixed(1) : '0.0';
    document.getElementById('change24hOver10DownPercent').textContent = down10Percent + '%';
    
    document.getElementById('todayNewHighCount').textContent = agg.today_new_high_count || 0;
    document.getElementById('todayNewLowCount').textContent = agg.today_new_low_count || 0;
    
    // 本轮统计
    const avgChange = agg.average_change || 0;
    const avgChangeEl = document.getElementById('averageChange');
    avgChangeEl.textContent = avgChange.toFixed(2) + '%';
    avgChangeEl.className = avgChange >= 0 ? 'text-2xl font-bold green-text' : 'text-2xl font-bold red-text';
    
    document.getElementById('riseRatio').textContent = (agg.green_ratio || 0).toFixed(1) + '%';
    document.getElementById('riseRatioDetail').textContent = `上涨 ${agg.green_count || 0} / 下跌 ${agg.red_count || 0}`;
    
    document.getElementById('surgeCount').textContent = agg.surge_count || 0;
    document.getElementById('surgeCrashDetail').textContent = `${agg.surge_count || 0} / ${agg.crash_count || 0}`;
    
    document.getElementById('riskAlertCount').textContent = agg.risk_alert_count || 0;
    
    // 急涨急跌统计
    document.getElementById('currentSurge').textContent = agg.surge_count || 0;
    document.getElementById('currentCrash').textContent = agg.crash_count || 0;
    document.getElementById('totalSurge').textContent = agg.today_total_surges || 0;
    document.getElementById('totalCrash').textContent = agg.today_total_crashes || 0;
    document.getElementById('surgeDiff').textContent = agg.surge_crash_diff || 0;
    document.getElementById('surgeRatio').textContent = (agg.surge_crash_ratio || 0).toFixed(2);
    
    // 市场趋势
    document.getElementById('marketState').textContent = agg.market_trend || '无序震荡';
    document.getElementById('marketStars').textContent = agg.market_trend_stars || '';
    document.getElementById('todaySurgeCount').textContent = agg.today_total_surges || 0;
    document.getElementById('todayCrashCount').textContent = agg.today_total_crashes || 0;
    document.getElementById('distanceToMaxSurge').textContent = agg.distance_to_high || 0;
    document.getElementById('distanceToNewLow').textContent = agg.distance_to_low || 0;
}

/**
 * 渲染币种表格（新结构：直接显示每个币种的19个字段）
 */
function renderCoinTable(coins) {
    const tbody = document.getElementById('coinTableBody');
    tbody.innerHTML = '';
    
    if (!coins || coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="17" class="text-center py-8 text-gray-500">暂无数据</td></tr>';
        return;
    }
    
    coins.forEach(coin => {
        const row = document.createElement('tr');
        row.className = 'coin-row hover:bg-gray-50';
        
        // 1. 序号
        row.innerHTML += `<td class="px-2 py-2 text-center">${coin.rank_num}</td>`;
        
        // 2. 币名
        row.innerHTML += `<td class="px-2 py-2 font-semibold">${coin.symbol}</td>`;
        
        // 3. 上轮涨跌
        const prevChange = coin.prev_round_change || 0;
        const prevChangeClass = prevChange >= 0 ? 'green-text' : 'red-text';
        row.innerHTML += `<td class="px-2 py-2 text-right ${prevChangeClass}">${prevChange.toFixed(2)}%</td>`;
        
        // 4. 当天急涨次数
        row.innerHTML += `<td class="px-2 py-2 text-center text-green-600">${coin.today_surge_count || 0}</td>`;
        
        // 5. 当天急跌次数
        row.innerHTML += `<td class="px-2 py-2 text-center text-red-600">${coin.today_crash_count || 0}</td>`;
        
        // 6. +4% 次数
        row.innerHTML += `<td class="px-2 py-2 text-center">${coin.extreme_up_4_count || 0}</td>`;
        
        // 7. -3% 次数
        row.innerHTML += `<td class="px-2 py-2 text-center">${coin.extreme_down_3_count || 0}</td>`;
        
        // 8. 今天V1
        row.innerHTML += `<td class="px-2 py-2 text-center text-blue-600">${coin.today_v1_count || 0}</td>`;
        
        // 9. 当天涨幅
        const todayChange = coin.today_change_percent || 0;
        const todayChangeClass = todayChange >= 0 ? 'green-text' : 'red-text';
        row.innerHTML += `<td class="px-2 py-2 text-right ${todayChangeClass}">${todayChange.toFixed(2)}%</td>`;
        
        // 10. 更新时间（显示简化版）
        const updateTime = coin.update_time ? coin.update_time.split(' ')[1] : '-';
        row.innerHTML += `<td class="px-2 py-2 text-center text-xs text-gray-500">${updateTime}</td>`;
        
        // 11. 历史高价
        row.innerHTML += `<td class="px-2 py-2 text-right">${coin.all_time_high ? coin.all_time_high.toFixed(6) : '-'}</td>`;
        
        // 12. 现价跌幅
        const priceDrop = coin.price_drop_from_ath || 0;
        const priceDropClass = priceDrop >= 0 ? 'green-text' : 'red-text';
        row.innerHTML += `<td class="px-2 py-2 text-right ${priceDropClass}">${priceDrop.toFixed(2)}%</td>`;
        
        // 13. 24h涨幅
        const change24h = coin.change_24h || 0;
        const change24hClass = change24h >= 0 ? 'green-text' : 'red-text';
        row.innerHTML += `<td class="px-2 py-2 text-right ${change24hClass}">${change24h.toFixed(2)}%</td>`;
        
        // 14. 优先级
        row.innerHTML += `<td class="px-2 py-2 text-center">${coin.priority_level || '-'}</td>`;
        
        // 15. 最高占比
        const highestRatio = coin.highest_ratio || 0;
        row.innerHTML += `<td class="px-2 py-2 text-right">${highestRatio.toFixed(2)}%</td>`;
        
        // 16. 最低占比
        const lowestRatio = coin.lowest_ratio || 0;
        row.innerHTML += `<td class="px-2 py-2 text-right">${lowestRatio.toFixed(2)}%</td>`;
        
        // 17. 这轮价格
        row.innerHTML += `<td class="px-2 py-2 text-right">$${coin.this_round_price ? coin.this_round_price.toFixed(6) : '-'}</td>`;
        
        tbody.appendChild(row);
    });
}

/**
 * 旧的渲染核心统计（已废弃，保留以防兼容性问题）
 */
function renderCoreStats_OLD(dashboard) {
    const latestRound = dashboard.latestRound || {};
    const specialStats = dashboard.specialStats || {};
    const stats = dashboard.stats || {};
    
    // 🆕 今日重点统计（渐变背景区域）
    const totalCoins = 29; // 假设29个币种
    
    // 24h涨幅>10%
    const up10 = specialStats.change24hOver10Up || 0;
    document.getElementById('change24hOver10Up').textContent = up10;
    const up10Percent = totalCoins > 0 ? ((up10 / totalCoins) * 100).toFixed(1) : '0.0';
    document.getElementById('change24hOver10UpPercent').textContent = up10Percent + '%';
    
    // 24h跌幅>10%
    const down10 = specialStats.change24hOver10Down || 0;
    document.getElementById('change24hOver10Down').textContent = down10;
    const down10Percent = totalCoins > 0 ? ((down10 / totalCoins) * 100).toFixed(1) : '0.0';
    document.getElementById('change24hOver10DownPercent').textContent = down10Percent + '%';
    
    // 今日创新高次数
    document.getElementById('todayNewHighCount').textContent = specialStats.todayNewHighCount || 0;
    
    // 今日创新低次数
    document.getElementById('todayNewLowCount').textContent = specialStats.todayNewLowCount || 0;
    
    // 基础统计（5个卡片）
    // 1. 平均涨跌幅
    const avgChange = latestRound.average_change || 0;
    const avgChangeEl = document.getElementById('averageChange');
    avgChangeEl.textContent = avgChange.toFixed(2) + '%';
    avgChangeEl.className = avgChange >= 0 ? 'text-2xl font-bold green-text' : 'text-2xl font-bold red-text';
    
    // 2. 涨色占比
    const upCount = stats.up_count || 0;
    const downCount = stats.down_count || 0;
    const riseRatioValue = totalCoins > 0 ? ((upCount / totalCoins) * 100).toFixed(1) : '0.0';
    document.getElementById('riseRatio').textContent = riseRatioValue + '%';
    document.getElementById('riseRatioDetail').textContent = `上涨 ${upCount} / 下跌 ${downCount}`;
    
    // 3. 急涨/急跌
    const surgeCount = latestRound.surge_count || 0;
    const crashCount = latestRound.crash_count || 0;
    document.getElementById('surgeCount').textContent = surgeCount;
    document.getElementById('surgeCrashDetail').textContent = `${surgeCount} / ${crashCount}`;
    
    // 4. 极端拉市
    const extremeUp = stats.extreme_up || 0;
    const extremeDown = stats.extreme_down || 0;
    document.getElementById('extremeMarket').textContent = extremeUp;
    document.getElementById('extremeMarketDetail').textContent = `${extremeUp} / ${extremeDown}`;
    
    // 5. 风控提示
    const riskCount = latestRound.risk_alert_count || 0;
    document.getElementById('riskAlertCount').textContent = riskCount;
    document.getElementById('riskAlertDetail').textContent = '绿区提示(6-12点)';
    
    // 急涨急跌统计
    document.getElementById('currentSurge').textContent = surgeCount;
    document.getElementById('currentCrash').textContent = crashCount;
    document.getElementById('totalSurge').textContent = specialStats.totalSurgeToday || 0;
    document.getElementById('totalCrash').textContent = specialStats.totalCrashToday || 0;
    const surgeDiff = (specialStats.totalSurgeToday || 0) - (specialStats.totalCrashToday || 0);
    document.getElementById('surgeDiff').textContent = surgeDiff;
    const surgeRatio = (specialStats.totalCrashToday || 0) !== 0 ? 
        ((specialStats.totalSurgeToday || 0) / (specialStats.totalCrashToday || 0)).toFixed(2) : 
        '-';
    document.getElementById('surgeRatio').textContent = surgeRatio;
    
    // 市场趋势分析
    const marketState = stats.market_state || '单边主升';
    document.getElementById('marketState').textContent = marketState;
    
    const marketStars = stats.market_stars || 2;
    let starsHtml = '';
    for (let i = 0; i < marketStars; i++) {
        starsHtml += '★';
    }
    document.getElementById('marketStars').textContent = starsHtml;
    
    document.getElementById('todaySurgeCount').textContent = specialStats.totalSurgeToday || 0;
    document.getElementById('todayCrashCount').textContent = specialStats.totalCrashToday || 0;
    document.getElementById('distanceToMaxSurge').textContent = stats.distance_to_max_surge || 0;
    document.getElementById('distanceToNewLow').textContent = stats.distance_to_new_low || 0;
}

/**
 * 旧的渲染币种表格函数（已废弃，已被上面的新版本替代）
 */
// function renderCoinTable_OLD2(dashboard, compare) { ... }

/**
 * 计算风险等级
 */
function calculateRiskLevel(riskAlertCount) {
    const now = new Date();
    const hour = now.getHours();
    
    let level = '低风险';
    let color = 'green';
    
    if (hour >= 0 && hour < 6) {
        if (riskAlertCount >= 4) {
            level = '高风险';
            color = 'red';
        } else if (riskAlertCount >= 3) {
            level = '中风险';
            color = 'orange';
        }
    } else if (hour >= 6 && hour < 12) {
        if (riskAlertCount >= 5) {
            level = '高风险';
            color = 'red';
        } else if (riskAlertCount >= 4) {
            level = '中风险';
            color = 'orange';
        }
    } else if (hour >= 12 && hour < 18) {
        if (riskAlertCount >= 6) {
            level = '高风险';
            color = 'red';
        } else if (riskAlertCount >= 5) {
            level = '中风险';
            color = 'orange';
        }
    } else if (hour >= 18 && hour < 24) {
        if (riskAlertCount >= 7) {
            level = '高风险';
            color = 'red';
        } else if (riskAlertCount >= 6) {
            level = '中风险';
            color = 'orange';
        }
    }
    
    return { level, color };
}

/**
 * 获取优先级图标
 */
function getPriorityIcon(priority) {
    if (priority === 1) {
        return '<i class="fas fa-star star-filled"></i>';
    } else {
        return '<i class="far fa-star star-empty"></i>';
    }
}

/**
 * 获取优先级徽章
 */
function getPriorityBadge(priority) {
    const levels = {
        1: '<span class="level-badge level-1">⭐ 一级</span>',
        2: '<span class="level-badge level-2">二级</span>',
        3: '<span class="level-badge level-3">三级</span>'
    };
    return levels[priority] || '<span class="level-badge">未知</span>';
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateOnly = dateStr.split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dateOnly === todayStr) {
        return `今天 (${dateStr})`;
    } else if (dateOnly === yesterdayStr) {
        return `昨天 (${dateStr})`;
    } else {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekday = weekdays[date.getDay()];
        return `${dateStr} (${weekday})`;
    }
}
