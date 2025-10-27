// 比价页面 JavaScript - V5.5
// 三栏布局：左栏（最高价格）、中栏（时间）、右栏（统计）

let currentData = null;
let filterText = '';

// 页面加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('比价页面加载完成');
    
    // 绑定事件
    bindEvents();
    
    // 加载数据
    loadCompareData();
    
    // 自动刷新（每30秒）
    setInterval(loadCompareData, 30000);
});

// 当前显示的统计表（'high' 或 'low'）
let currentStatsView = 'high';

// 绑定事件
function bindEvents() {
    // 筛选输入框
    document.getElementById('filterInput').addEventListener('input', function(e) {
        filterText = e.target.value.trim();
        if (currentData) {
            renderAllTables(currentData);
        }
    });
    
    // 切换统计表按钮
    document.getElementById('toggleStatsBtn').addEventListener('click', toggleStatsTable);
    
    // 导出按钮
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // 导入按钮
    document.getElementById('importBtn').addEventListener('click', importData);
    
    // 添加按钮
    document.getElementById('addBtn').addEventListener('click', () => {
        alert('添加功能开发中...');
    });
    
    // 删除按钮
    document.getElementById('deleteBtn').addEventListener('click', () => {
        alert('删除功能开发中...');
    });
    
    // 配置按钮
    document.getElementById('configBtn').addEventListener('click', () => {
        alert('推送配置功能开发中...');
    });
    
    // 机器号按钮
    document.getElementById('machineBtn').addEventListener('click', () => {
        alert('机器号配置功能开发中...');
    });
}

// 切换统计表（最高/最低）
function toggleStatsTable() {
    const highTable = document.getElementById('highStatsTable');
    const lowTable = document.getElementById('lowStatsTable');
    const title = document.getElementById('rightPanelTitle');
    
    if (currentStatsView === 'high') {
        // 切换到最低
        highTable.style.display = 'none';
        lowTable.style.display = 'table';
        title.textContent = '最低';
        currentStatsView = 'low';
    } else {
        // 切换到最高
        highTable.style.display = 'table';
        lowTable.style.display = 'none';
        title.textContent = '最高';
        currentStatsView = 'high';
    }
}

// 加载比价数据
async function loadCompareData() {
    try {
        console.log('正在加载比价数据...');
        
        // 从API获取数据
        const response = await axios.get('/api/compare');
        const apiData = response.data;
        
        if (!apiData.coins || apiData.coins.length === 0) {
            throw new Error('API返回数据为空');
        }
        
        currentData = {
            coins: apiData.coins.map(coin => ({
                symbol: coin.symbol,
                highPrice: coin.highPrice,
                highCount: coin.highCount || 0,
                lowPrice: coin.lowPrice,
                lowCount: coin.lowCount || 0,
                highRatio: coin.highRatio,
                lowRatio: coin.lowRatio,
                currentPrice: coin.currentPrice,
                ath_date: coin.ath_date,
                atl_date: coin.atl_date,
                last_updated: coin.last_updated
            })),
            lastUpdated: apiData.lastUpdated
        };
        
        // 渲染所有表格
        renderAllTables(currentData);
        
        console.log('比价数据加载完成');
        
    } catch (error) {
        console.error('加载数据失败:', error);
        showError('加载数据失败: ' + error.message);
    }
}

// 渲染所有表格
function renderAllTables(data) {
    renderLeftTable(data);
    renderCenterTable(data);
    renderHighStatsTable(data);
    renderLowStatsTable(data);
}

// 渲染左栏表格：最高价格数据
function renderLeftTable(data) {
    const tbody = document.getElementById('leftTableBody');
    
    if (!data.coins || data.coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">暂无数据</td></tr>';
        return;
    }
    
    // 应用筛选
    let filteredCoins = data.coins;
    if (filterText) {
        filteredCoins = data.coins.filter(c => c.symbol.toUpperCase().includes(filterText.toUpperCase()));
    }
    
    if (filteredCoins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">筛选结果为空</td></tr>';
        return;
    }
    
    // 生成表格行
    let html = '';
    filteredCoins.forEach((coin) => {
        // 最高占比样式
        let highRatioClass = '';
        if (coin.highRatio >= 100) {
            highRatioClass = 'green-bg';
        } else if (coin.highRatio >= 90) {
            highRatioClass = 'light-green-bg';
        } else if (coin.highRatio >= 80) {
            highRatioClass = 'yellow-bg';
        } else if (coin.highRatio >= 70) {
            highRatioClass = 'light-yellow-bg';
        }
        
        // 最低占比样式
        let lowRatioClass = '';
        if (coin.lowRatio >= 120) {
            lowRatioClass = 'green-bg';
        } else if (coin.lowRatio >= 110) {
            lowRatioClass = 'light-green-bg';
        } else if (coin.lowRatio >= 105) {
            lowRatioClass = 'yellow-bg';
        } else if (coin.lowRatio >= 100) {
            lowRatioClass = 'light-yellow-bg';
        }
        
        // 计次列黄色背景
        const countClass = 'yellow-bg';
        
        // 单日最高（假设数据，实际应从API获取）
        const dailyHigh = coin.currentPrice.toFixed(6);
        const dailyHighClass = ''; // 可以根据条件添加颜色
        
        html += `
            <tr>
                <td class="coin-name">${coin.symbol}</td>
                <td>${coin.highPrice.toFixed(6)}</td>
                <td class="${countClass} count-column">${coin.highCount}</td>
                <td>${coin.lowPrice.toFixed(6)}</td>
                <td class="${countClass} count-column">${coin.lowCount}</td>
                <td class="${highRatioClass}">${coin.highRatio.toFixed(1)}%</td>
                <td class="${lowRatioClass}">${coin.lowRatio.toFixed(1)}%</td>
                <td class="${dailyHighClass}">${dailyHigh}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 渲染中栏表格：时间信息
function renderCenterTable(data) {
    const tbody = document.getElementById('centerTableBody');
    
    if (!data.coins || data.coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">暂无数据</td></tr>';
        return;
    }
    
    // 应用筛选
    let filteredCoins = data.coins;
    if (filterText) {
        filteredCoins = data.coins.filter(c => c.symbol.toUpperCase().includes(filterText.toUpperCase()));
    }
    
    if (filteredCoins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">筛选结果为空</td></tr>';
        return;
    }
    
    // 生成表格行
    let html = '';
    filteredCoins.forEach((coin) => {
        // 格式化时间
        const updateTime = coin.last_updated 
            ? formatDateTime(new Date(coin.last_updated))
            : '2025-10-27 21:46:42';
        
        // 状态判断：只显示创新高或创新低
        // highRatio = (currentPrice / highPrice) * 100
        // lowRatio = (currentPrice / lowPrice) * 100
        // 
        // 判断逻辑：
        // - 如果 highRatio >= 99.5%，说明当前价格接近或达到历史最高 → 创新高
        // - 如果 lowRatio <= 100.5%，说明当前价格接近或达到历史最低 → 创新低
        // - 否则，比较离哪个更近：highRatio 越大越接近最高，lowRatio 越小越接近最低
        
        const isNewHigh = coin.highRatio >= 99.5;  // 达到历史最高的99.5%
        const isNewLow = coin.lowRatio <= 100.5;   // 接近历史最低（不超过0.5%）
        
        let status = '';
        let statusClass = '';
        
        if (isNewHigh) {
            // 创新高
            status = '创新高';
            statusClass = 'green-bg';
        } else if (isNewLow) {
            // 创新低
            status = '创新低';
            statusClass = 'red-bg';
        } else {
            // 判断离哪个更近
            // highRatio 越大，离最高越近
            // lowRatio 越小（接近100），离最低越近
            const distanceToHigh = 100 - coin.highRatio;  // 距离最高的百分比
            const distanceToLow = coin.lowRatio - 100;     // 距离最低的百分比
            
            if (distanceToHigh < distanceToLow) {
                status = '创新高';
                statusClass = 'green-bg';
            } else {
                status = '创新低';
                statusClass = 'red-bg';
            }
        }
        
        // 特播列（假设数据，实际应从API获取）
        const special = '0.29887';
        
        html += `
            <tr>
                <td class="coin-name">${coin.symbol}</td>
                <td class="time-column">${updateTime}</td>
                <td class="${statusClass} status-column">${status}</td>
                <td>${special}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 渲染右栏表格：最高统计数据
function renderHighStatsTable(data) {
    const tbody = document.getElementById('highStatsBody');
    
    if (!data.coins || data.coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">暂无数据</td></tr>';
        return;
    }
    
    // 应用筛选
    let filteredCoins = data.coins;
    if (filterText) {
        filteredCoins = data.coins.filter(c => c.symbol.toUpperCase().includes(filterText.toUpperCase()));
    }
    
    if (filteredCoins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">筛选结果为空</td></tr>';
        return;
    }
    
    // 生成表格行
    let html = '';
    filteredCoins.forEach((coin) => {
        // 最高统计数据（假设数据，实际应从API获取历史统计）
        const today = '0';
        const threeDays = '0';
        const sevenDays = '0';
        
        html += `
            <tr>
                <td class="coin-name">${coin.symbol}</td>
                <td class="count-column">${today}</td>
                <td class="count-column">${threeDays}</td>
                <td class="count-column">${sevenDays}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 渲染右栏表格：最低统计数据
function renderLowStatsTable(data) {
    const tbody = document.getElementById('lowStatsBody');
    
    if (!data.coins || data.coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">暂无数据</td></tr>';
        return;
    }
    
    // 应用筛选
    let filteredCoins = data.coins;
    if (filterText) {
        filteredCoins = data.coins.filter(c => c.symbol.toUpperCase().includes(filterText.toUpperCase()));
    }
    
    if (filteredCoins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">筛选结果为空</td></tr>';
        return;
    }
    
    // 生成表格行
    let html = '';
    filteredCoins.forEach((coin) => {
        // 最低统计数据（假设数据，实际应从API获取历史统计）
        const today = '0';
        const threeDays = '0';
        const sevenDays = '0';
        
        html += `
            <tr>
                <td class="coin-name">${coin.symbol}</td>
                <td class="count-column">${today}</td>
                <td class="count-column">${threeDays}</td>
                <td class="count-column">${sevenDays}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 格式化日期时间
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 导出数据
function exportData() {
    if (!currentData) {
        alert('暂无数据可导出');
        return;
    }
    
    try {
        // 准备导出数据
        const exportData = currentData.coins.map((coin) => ({
            币名: coin.symbol,
            最高价格: coin.highPrice.toFixed(8),
            高点计次: coin.highCount,
            最低价格: coin.lowPrice.toFixed(8),
            低点计次: coin.lowCount,
            最高占比: coin.highRatio.toFixed(2) + '%',
            最低占比: coin.lowRatio.toFixed(2) + '%',
            当前价格: coin.currentPrice.toFixed(8),
            更新时间: coin.last_updated || '--'
        }));
        
        // 转换为CSV
        const headers = Object.keys(exportData[0]);
        let csv = headers.join(',') + '\n';
        
        exportData.forEach(row => {
            csv += headers.map(h => row[h]).join(',') + '\n';
        });
        
        // 下载文件
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `比价数据_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess('数据已导出');
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    }
}

// 导入数据
function importData() {
    alert('导入功能开发中...');
}

// 显示错误信息
function showError(message) {
    console.error(message);
    document.getElementById('leftTableBody').innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 20px; color: red;">
                ${message}
                <br><br>
                <button class="control-btn" onclick="loadCompareData()">重新加载</button>
            </td>
        </tr>
    `;
    document.getElementById('centerTableBody').innerHTML = `
        <tr><td colspan="4" style="text-align: center; color: red;">${message}</td></tr>
    `;
    document.getElementById('highStatsBody').innerHTML = `
        <tr><td colspan="4" style="text-align: center; color: red;">${message}</td></tr>
    `;
    document.getElementById('lowStatsBody').innerHTML = `
        <tr><td colspan="4" style="text-align: center; color: red;">${message}</td></tr>
    `;
}

// 显示成功信息
function showSuccess(message) {
    console.log(message);
}
