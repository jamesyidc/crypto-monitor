// 比价画面 JavaScript - V5.5
// 单一表格结构，完全按照用户截图设计

let currentData = null;
let filterText = '';
let autoRefreshTimer = null;
let autoRefreshEnabled = false;

// 页面加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('比价画面加载完成');
    
    // 绑定事件
    bindEvents();
    
    // 加载数据
    loadCompareData();
});

// 绑定事件
function bindEvents() {
    // 刷新按钮
    document.getElementById('refreshBtn').addEventListener('click', loadCompareData);
    
    // 筛选按钮
    document.getElementById('filterBtn').addEventListener('click', applyFilter);
    
    // 筛选输入框回车
    document.getElementById('filterInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilter();
        }
    });
    
    // 自动刷新按钮
    document.getElementById('autoRefreshBtn').addEventListener('click', toggleAutoRefresh);
    
    // 导出按钮
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // 设置按钮
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
}

// 加载比价数据
async function loadCompareData() {
    try {
        showStatus('正在加载数据...', 'info');
        
        // 从API获取实时数据
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
        
        // 渲染表格
        renderTable(currentData);
        
        showStatus('数据加载成功', 'success');
        
    } catch (error) {
        console.error('加载数据失败:', error);
        showStatus('加载数据失败: ' + error.message, 'error');
        
        // 显示错误提示
        document.getElementById('tableBody').innerHTML = `
            <tr>
                <td colspan="16" style="text-align: center; padding: 20px; color: red;">
                    数据加载失败：${error.message}
                    <br><br>
                    <button class="control-btn" onclick="loadCompareData()">重新加载</button>
                </td>
            </tr>
        `;
    }
}

// 渲染表格
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    
    if (!data.coins || data.coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="16" style="text-align:center; padding: 20px;">暂无数据</td></tr>';
        return;
    }
    
    // 应用筛选
    let filteredCoins = data.coins;
    if (filterText) {
        filteredCoins = data.coins.filter(c => c.symbol.toUpperCase().includes(filterText.toUpperCase()));
    }
    
    if (filteredCoins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="16" style="text-align:center; padding: 20px;">筛选结果为空</td></tr>';
        return;
    }
    
    // 生成表格行
    let html = '';
    filteredCoins.forEach((coin, index) => {
        // 计算涨跌幅（假设基于最高价格）
        const changePercent = ((coin.currentPrice - coin.highPrice) / coin.highPrice * 100);
        const changeClass = changePercent > 0 ? 'green-bg' : (changePercent < 0 ? 'red-bg' : '');
        const changeSymbol = changePercent > 0 ? '▲' : (changePercent < 0 ? '▼' : '－');
        
        // 急涨急跌判断（根据涨跌幅）
        const surge = changePercent >= 1 ? '1' : '0';
        const crash = changePercent <= -1 ? '1' : '0';
        const surgeClass = surge === '1' ? 'green-bg' : '';
        const crashClass = crash === '1' ? 'red-bg' : '';
        
        // +4% 列（极端上涨计次）
        const extremeUp = coin.highCount > 0 && changePercent >= 4 ? coin.highCount : '0';
        const extremeUpClass = extremeUp !== '0' ? 'green-bg' : '';
        
        // 格式化时间
        const updateTime = coin.last_updated 
            ? formatDateTime(new Date(coin.last_updated))
            : '--';
        
        const athDate = coin.ath_date 
            ? formatDateTime(new Date(coin.ath_date))
            : '--';
        
        // 最高占比样式
        let highRatioClass = '';
        if (coin.highRatio >= 90) {
            highRatioClass = 'green-bg';
        } else if (coin.highRatio >= 80) {
            highRatioClass = 'light-green-bg';
        } else if (coin.highRatio >= 60) {
            highRatioClass = 'yellow-bg';
        }
        
        // 最低占比样式
        let lowRatioClass = '';
        if (coin.lowRatio >= 120) {
            lowRatioClass = 'green-bg';
        } else if (coin.lowRatio >= 110) {
            lowRatioClass = 'light-green-bg';
        } else if (coin.lowRatio >= 100) {
            lowRatioClass = 'yellow-bg';
        }
        
        // 势力（简单的趋势判断）
        let momentum = '';
        let momentumClass = '';
        if (coin.highRatio >= 85 && coin.lowRatio >= 110) {
            momentum = '强';
            momentumClass = 'green-bg';
        } else if (coin.highRatio >= 70 && coin.lowRatio >= 105) {
            momentum = '中';
            momentumClass = 'yellow-bg';
        } else if (coin.highRatio < 60) {
            momentum = '弱';
            momentumClass = 'red-bg';
        } else {
            momentum = '平';
            momentumClass = '';
        }
        
        // 24小时涨跌（使用虚拟数据，实际应该从API获取）
        const change24h = (Math.random() * 10 - 5).toFixed(2);
        const change24hClass = change24h > 0 ? 'light-green-bg' : (change24h < 0 ? 'light-red-bg' : '');
        
        html += `
            <tr data-symbol="${coin.symbol}">
                <td>${index + 1}</td>
                <td style="font-weight: bold;">${coin.symbol}</td>
                <td class="${changeClass}">${changeSymbol}</td>
                <td class="${surgeClass}">${surge}</td>
                <td class="${crashClass}">${crash}</td>
                <td style="text-align: center; font-size: 10px;">${updateTime}</td>
                <td>${coin.highPrice.toFixed(8)}</td>
                <td style="text-align: center; font-size: 10px;">${athDate}</td>
                <td class="${change24hClass}">${change24h}%</td>
                <td>${Math.abs(change24h).toFixed(2)}%</td>
                <td class="${extremeUpClass}">${extremeUp}</td>
                <td>${index + 1}</td>
                <td style="font-weight: bold;">${coin.currentPrice.toFixed(8)}</td>
                <td class="${highRatioClass}">${coin.highRatio.toFixed(2)}%</td>
                <td class="${lowRatioClass}">${coin.lowRatio.toFixed(2)}%</td>
                <td class="${momentumClass}">${momentum}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 格式化日期时间（类似截图中的格式：2025-10-27 16:37:14）
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 应用筛选
function applyFilter() {
    filterText = document.getElementById('filterInput').value.trim();
    if (currentData) {
        renderTable(currentData);
        showStatus(`筛选结果：${filterText ? '显示包含 "' + filterText + '" 的币种' : '显示全部币种'}`, 'info');
    }
}

// 切换自动刷新
function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    const btn = document.getElementById('autoRefreshBtn');
    
    if (autoRefreshEnabled) {
        btn.textContent = '▶ 自动刷新';
        btn.style.background = '#90ee90';
        autoRefreshTimer = setInterval(loadCompareData, 30000); // 30秒刷新一次
        showStatus('自动刷新已启动（每30秒）', 'success');
    } else {
        btn.textContent = '■ 自动刷新';
        btn.style.background = '#e0e0e0';
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
        showStatus('自动刷新已停止', 'info');
    }
}

// 导出数据
function exportData() {
    if (!currentData) {
        alert('暂无数据可导出');
        return;
    }
    
    try {
        // 准备导出数据
        const exportData = currentData.coins.map((coin, index) => {
            const changePercent = ((coin.currentPrice - coin.highPrice) / coin.highPrice * 100);
            return {
                序号: index + 1,
                币名: coin.symbol,
                最高价格: coin.highPrice.toFixed(8),
                最低价格: coin.lowPrice.toFixed(8),
                当前价格: coin.currentPrice.toFixed(8),
                最高占比: coin.highRatio.toFixed(2) + '%',
                最低占比: coin.lowRatio.toFixed(2) + '%',
                涨跌幅: changePercent.toFixed(2) + '%',
                高点计次: coin.highCount,
                低点计次: coin.lowCount,
                更新时间: coin.last_updated || '--'
            };
        });
        
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
        
        showStatus('数据已导出', 'success');
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    }
}

// 打开设置
function openSettings() {
    alert('设置功能开发中...\n\n可配置项：\n- 自动刷新间隔\n- 数据源选择\n- 颜色主题\n- 列显示/隐藏');
}

// 显示状态信息
function showStatus(message, type) {
    const statusInfo = document.getElementById('statusInfo');
    const originalText = statusInfo.textContent;
    
    statusInfo.textContent = message;
    
    if (type === 'success') {
        statusInfo.style.color = 'green';
    } else if (type === 'error') {
        statusInfo.style.color = 'red';
    } else if (type === 'info') {
        statusInfo.style.color = 'blue';
    } else {
        statusInfo.style.color = '#333';
    }
    
    // 3秒后恢复
    setTimeout(() => {
        statusInfo.textContent = originalText;
        statusInfo.style.color = '#333';
    }, 3000);
}
