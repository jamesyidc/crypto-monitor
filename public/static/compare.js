// 全局变量
let filterText = '';
let allData = {
    summary: [],      // 左栏：汇总统计
    records: [],      // 中栏：极值记录
    timeStats: []     // 右栏：时间段统计
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    // 每30秒自动刷新
    setInterval(loadAllData, 30000);
});

// 加载所有数据
async function loadAllData() {
    try {
        // 并行获取三个接口的数据
        const [summaryRes, recordsRes, timeStatsRes] = await Promise.all([
            axios.get('/api/compare/summary'),
            axios.get('/api/compare/records'),
            axios.get('/api/compare/timestats')
        ]);

        allData.summary = summaryRes.data.coins || [];
        allData.records = recordsRes.data.records || [];
        allData.timeStats = timeStatsRes.data.stats || [];

        // 更新时间
        if (summaryRes.data.updateTime) {
            document.getElementById('updateTime').textContent = 
                new Date(summaryRes.data.updateTime).toLocaleString('zh-CN');
        }

        // 渲染三个表格
        renderLeftTable();
        renderMiddleTable();
        renderRightTable();

    } catch (error) {
        console.error('加载数据失败:', error);
        showError('加载数据失败: ' + error.message);
    }
}

// 渲染左栏表格：汇总统计（7列）
function renderLeftTable() {
    const tbody = document.getElementById('leftTableBody');
    
    if (!allData.summary || allData.summary.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">暂无数据</td></tr>';
        return;
    }

    // 应用筛选
    let filteredData = allData.summary;
    if (filterText) {
        filteredData = allData.summary.filter(c => 
            c.symbol.toUpperCase().includes(filterText.toUpperCase())
        );
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">筛选结果为空</td></tr>';
        return;
    }

    // 生成表格行
    let html = '';
    filteredData.forEach((coin) => {
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

        html += `
            <tr>
                <td class="coin-name">${coin.symbol}</td>
                <td>${coin.highPrice.toFixed(6)}</td>
                <td class="count-column">${coin.highCount}</td>
                <td>${coin.lowPrice.toFixed(6)}</td>
                <td class="count-column">${coin.lowCount}</td>
                <td class="${highRatioClass}">${coin.highRatio.toFixed(1)}%</td>
                <td class="${lowRatioClass}">${coin.lowRatio.toFixed(1)}%</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 渲染中栏表格：极值记录（4列）
function renderMiddleTable() {
    const tbody = document.getElementById('middleTableBody');
    
    if (!allData.records || allData.records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">暂无记录</td></tr>';
        return;
    }

    // 应用筛选
    let filteredData = allData.records;
    if (filterText) {
        filteredData = allData.records.filter(r => 
            r.symbol.toUpperCase().includes(filterText.toUpperCase())
        );
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">筛选结果为空</td></tr>';
        return;
    }

    // 生成表格行
    let html = '';
    filteredData.forEach((record) => {
        const statusClass = record.record_type === 'high' ? 'status-high' : 'status-low';
        const statusText = record.record_type === 'high' ? '新高' : '新低';
        const time = new Date(record.timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        html += `
            <tr>
                <td class="coin-name">${record.symbol}</td>
                <td>${time}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>-</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 渲染右栏表格：时间段统计（4列）
function renderRightTable() {
    const tbody = document.getElementById('rightTableBody');
    
    if (!allData.timeStats || allData.timeStats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">暂无统计</td></tr>';
        return;
    }

    // 应用筛选
    let filteredData = allData.timeStats;
    if (filterText) {
        filteredData = allData.timeStats.filter(s => 
            s.symbol.toUpperCase().includes(filterText.toUpperCase())
        );
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">筛选结果为空</td></tr>';
        return;
    }

    // 生成表格行
    let html = '';
    filteredData.forEach((stat) => {
        const todayClass = stat.today > 0 ? 'count-cell has-value' : 'count-cell';
        const threeDayClass = stat.three_days > 0 ? 'count-cell has-value' : 'count-cell';
        const sevenDayClass = stat.seven_days > 0 ? 'count-cell has-value' : 'count-cell';

        html += `
            <tr>
                <td class="coin-name">${stat.symbol}</td>
                <td class="${todayClass}">${stat.today || 0}</td>
                <td class="${threeDayClass}">${stat.three_days || 0}</td>
                <td class="${sevenDayClass}">${stat.seven_days || 0}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 应用筛选
function applyFilter() {
    filterText = document.getElementById('filterInput').value.trim();
    renderLeftTable();
    renderMiddleTable();
    renderRightTable();
}

// 清除筛选
function clearFilter() {
    document.getElementById('filterInput').value = '';
    filterText = '';
    renderLeftTable();
    renderMiddleTable();
    renderRightTable();
}

// 刷新数据
function refreshData() {
    loadAllData();
}

// 显示错误信息
function showError(message) {
    const tbody1 = document.getElementById('leftTableBody');
    const tbody2 = document.getElementById('middleTableBody');
    const tbody3 = document.getElementById('rightTableBody');
    
    tbody1.innerHTML = `<tr><td colspan="7" class="loading" style="color: red;">${message}</td></tr>`;
    tbody2.innerHTML = `<tr><td colspan="4" class="loading" style="color: red;">${message}</td></tr>`;
    tbody3.innerHTML = `<tr><td colspan="4" class="loading" style="color: red;">${message}</td></tr>`;
}
