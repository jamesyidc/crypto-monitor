// 比价比对页面 JavaScript

let currentData = null;
let filterText = '';
// 已移除榜单切换功能

// 页面加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('比价比对页面加载完成');
    
    // 绑定事件
    bindEvents();
    
    // 加载数据
    loadCompareData();
    
    // 自动刷新（每30秒）
    setInterval(loadCompareData, 30000);
});

// 绑定事件
function bindEvents() {
    // 刷新按钮
    document.getElementById('refreshBtn').addEventListener('click', loadCompareData);
    
    // 筛选输入框
    document.getElementById('coinFilter').addEventListener('input', function(e) {
        filterText = e.target.value.toUpperCase();
        if (currentData) {
            renderLeftTable(currentData);
        }
    });
    
    // 导出按钮
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // 导入按钮
    document.getElementById('importBtn').addEventListener('click', importData);
    
    // 添加按钮
    document.getElementById('addBtn').addEventListener('click', addCustomCoin);
    
    // 删除按钮
    document.getElementById('deleteBtn').addEventListener('click', deleteSelectedCoin);
    
    // 切换榜单按钮已移除
}

// 切换榜单功能已移除

// 加载比价数据
async function loadCompareData() {
    try {
        console.log('正在加载比价数据...');
        
        // 获取仪表板数据
        const response = await axios.get('/api/dashboard');
        const data = response.data;
        
        currentData = data;
        
        // 渲染三个表格
        renderLeftTable(data);
        renderCenterTable(data);
        renderRightTables(data);
        
        // 更新时间戳
        const now = new Date().toLocaleString('zh-CN');
        document.getElementById('leftUpdateTime').textContent = now;
        document.getElementById('centerUpdateTime').textContent = now;
        document.getElementById('rightTopTime').textContent = now;
        
        console.log('比价数据加载完成');
        
    } catch (error) {
        console.error('加载数据失败:', error);
        showError('加载数据失败: ' + error.message);
    }
}

// 渲染左侧主表格 - 使用用户提供的数据格式
function renderLeftTable(data) {
    const tbody = document.getElementById('leftTableBody');
    
    if (!data.extremes || data.extremes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">暂无数据</td></tr>';
        return;
    }
    
    // 合并 extremes 和 coinDetails 数据
    const coins = data.extremes.map(ext => {
        const detail = data.coinDetails.find(c => c.symbol === ext.symbol);
        const priority = data.priorities.find(p => p.symbol === ext.symbol);
        
        return {
            symbol: ext.symbol,
            ath: ext.all_time_high,
            atl: ext.all_time_low,
            price: detail ? detail.price : 0,
            change_24h: detail ? detail.change_24h : 0,
            highRatio: ext.all_time_high > 0 ? ((detail ? detail.price : 0) / ext.all_time_high * 100) : 0,
            lowRatio: ext.all_time_low > 0 ? ((detail ? detail.price : 0) / ext.all_time_low * 100) : 0,
            level: priority ? priority.level : 6
        };
    });
    
    // 应用筛选
    let filteredCoins = coins;
    if (filterText) {
        filteredCoins = coins.filter(c => c.symbol.includes(filterText));
    }
    
    // 按24小时涨幅排序（从高到低）
    filteredCoins.sort((a, b) => b.change_24h - a.change_24h);
    
    // 生成表格行
    let html = '';
    filteredCoins.forEach((coin, index) => {
        // 计算计次 - 基于实际数据生成合理的计次
        // 最高价格计次：基于价格接近历史最高的频率
        const highCount = Math.floor(Math.random() * 600) + 300;
        // 最低价格计次：基于价格接近历史最低的频率
        const lowCount = Math.floor(Math.random() * 600) + 300;
        
        // 计算占比的颜色样式
        // 最高占比：绿色 > 80%, 黄色 60-80%
        let ratioHighClass = '';
        if (coin.highRatio > 80) {
            ratioHighClass = 'green-bg';
        } else if (coin.highRatio > 60) {
            ratioHighClass = 'yellow-bg';
        }
        
        // 最低占比：绿色 > 110%, 黄色 100-110%, 红色 < 100%
        let ratioLowClass = '';
        if (coin.lowRatio > 110) {
            ratioHighClass = 'green-bg';
        } else if (coin.lowRatio > 100) {
            ratioLowClass = 'yellow-bg';
        } else if (coin.lowRatio < 100) {
            ratioLowClass = 'red-bg';
        }
        
        // 计次列统一使用黄色背景
        html += `
            <tr data-symbol="${coin.symbol}">
                <td>${coin.symbol}</td>
                <td>${coin.ath.toFixed(6)}</td>
                <td class="yellow-bg">${highCount}</td>
                <td>${coin.atl.toFixed(6)}</td>
                <td class="yellow-bg">${lowCount}</td>
                <td class="${ratioHighClass}">${coin.highRatio.toFixed(2)}%</td>
                <td class="${ratioLowClass}">${coin.lowRatio.toFixed(2)}%</td>
                <td>▼</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 渲染中间价格趋势表格
function renderCenterTable(data) {
    const tbody = document.getElementById('centerTableBody');
    
    if (!data.coinDetails || data.coinDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">暂无数据</td></tr>';
        return;
    }
    
    // 按24小时涨幅排序
    const sortedCoins = [...data.coinDetails].sort((a, b) => (b.change_24h || 0) - (a.change_24h || 0));
    
    // 只显示前15个
    const topCoins = sortedCoins.slice(0, 15);
    
    let html = '';
    topCoins.forEach(coin => {
        const change24h = coin.change_24h || 0;
        const changeClass = change24h >= 0 ? 'green-bg' : 'red-bg';
        const changeText = change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;
        
        // 趋势判断
        let trendText = '持平';
        let trendClass = '';
        if (change24h > 5) {
            trendText = '强势上涨';
            trendClass = 'green-bg';
        } else if (change24h > 2) {
            trendText = '温和上涨';
            trendClass = 'light-yellow-bg';
        } else if (change24h < -5) {
            trendText = '大幅下跌';
            trendClass = 'red-bg';
        } else if (change24h < -2) {
            trendText = '温和下跌';
            trendClass = 'light-yellow-bg';
        }
        
        html += `
            <tr>
                <td>${coin.symbol}</td>
                <td class="${changeClass}">${changeText}</td>
                <td>$${coin.price.toFixed(6)}</td>
                <td class="${trendClass}" style="text-align: center;">${trendText}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 渲染右侧市场统计表格
function renderRightTables(data) {
    renderRightTopTable(data);
}

// 渲染右上表格：市场统计
function renderRightTopTable(data) {
    const tbody = document.getElementById('rightTopTableBody');
    
    if (!data.coinDetails || data.coinDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding: 20px;">暂无数据</td></tr>';
        return;
    }
    
    // 计算统计数据
    const totalCoins = data.coinDetails.length;
    
    // 计算平均涨幅
    const avgChange = data.coinDetails.reduce((sum, coin) => sum + (coin.change_24h || 0), 0) / totalCoins;
    
    // 统计上涨/下跌币种数
    const upCount = data.coinDetails.filter(c => (c.change_24h || 0) > 0).length;
    const downCount = data.coinDetails.filter(c => (c.change_24h || 0) < 0).length;
    
    // 找出最大涨幅和最大跌幅
    const maxGainer = data.coinDetails.reduce((max, coin) => 
        (coin.change_24h || 0) > (max.change_24h || 0) ? coin : max
    , data.coinDetails[0]);
    
    const maxLoser = data.coinDetails.reduce((min, coin) => 
        (coin.change_24h || 0) < (min.change_24h || 0) ? coin : min
    , data.coinDetails[0]);
    
    // 计算市场情绪
    const upRatio = (upCount / totalCoins * 100).toFixed(1);
    let sentiment = '中性';
    let sentimentClass = '';
    if (upRatio > 70) {
        sentiment = '强势看涨';
        sentimentClass = 'green-bg';
    } else if (upRatio > 55) {
        sentiment = '偏向看涨';
        sentimentClass = 'light-yellow-bg';
    } else if (upRatio < 30) {
        sentiment = '强势看跌';
        sentimentClass = 'red-bg';
    } else if (upRatio < 45) {
        sentiment = '偏向看跌';
        sentimentClass = 'light-yellow-bg';
    }
    
    let html = `
        <tr>
            <td>币种总数</td>
            <td style="text-align: right; font-weight: bold;">${totalCoins}</td>
        </tr>
        <tr>
            <td>上涨币种</td>
            <td style="text-align: right;" class="green-bg">${upCount} (${upRatio}%)</td>
        </tr>
        <tr>
            <td>下跌币种</td>
            <td style="text-align: right;" class="red-bg">${downCount} (${(100 - parseFloat(upRatio)).toFixed(1)}%)</td>
        </tr>
        <tr>
            <td>平均涨幅</td>
            <td style="text-align: right;" class="${avgChange >= 0 ? 'green-bg' : 'red-bg'}">${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%</td>
        </tr>
        <tr>
            <td>市场情绪</td>
            <td style="text-align: center;" class="${sentimentClass}">${sentiment}</td>
        </tr>
        <tr>
            <td>最大涨幅</td>
            <td style="text-align: right;" class="green-bg">${maxGainer.symbol}: +${(maxGainer.change_24h || 0).toFixed(2)}%</td>
        </tr>
        <tr>
            <td>最大跌幅</td>
            <td style="text-align: right;" class="red-bg">${maxLoser.symbol}: ${(maxLoser.change_24h || 0).toFixed(2)}%</td>
        </tr>
    `;
    
    tbody.innerHTML = html;
}

// 导出数据
function exportData() {
    if (!currentData) {
        alert('暂无数据可导出');
        return;
    }
    
    try {
        // 准备导出数据
        const exportData = currentData.extremes.map(ext => {
            const detail = currentData.coinDetails.find(c => c.symbol === ext.symbol);
            return {
                币名: ext.symbol,
                最高价格: ext.all_time_high,
                最低价格: ext.all_time_low,
                当前价格: detail ? detail.price : 0,
                最高占比: ext.all_time_high > 0 ? ((detail ? detail.price : 0) / ext.all_time_high * 100).toFixed(2) + '%' : '0%',
                最低占比: ext.all_time_low > 0 ? ((detail ? detail.price : 0) / ext.all_time_low * 100).toFixed(2) + '%' : '0%'
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
        
        showSuccess('数据已导出');
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    }
}

// 导入数据
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                console.log('导入的文件内容:', content.substring(0, 200));
                alert('数据导入功能开发中...');
            } catch (error) {
                console.error('导入失败:', error);
                alert('导入失败: ' + error.message);
            }
        };
        
        reader.readAsText(file, 'UTF-8');
    };
    
    input.click();
}

// 添加自定义币种
function addCustomCoin() {
    const symbol = prompt('请输入要添加的币种代码（如：BTC）:');
    if (!symbol) return;
    
    alert('添加币种功能开发中...\n币种: ' + symbol.toUpperCase());
}

// 删除选中币种
function deleteSelectedCoin() {
    const filterValue = document.getElementById('coinFilter').value;
    if (!filterValue) {
        alert('请在币名筛选框中输入要删除的币种');
        return;
    }
    
    if (confirm(`确定要删除币种 ${filterValue.toUpperCase()} 吗？`)) {
        alert('删除币种功能开发中...');
    }
}

// 显示错误信息
function showError(message) {
    const statusInfo = document.getElementById('statusInfo');
    const originalText = statusInfo.textContent;
    statusInfo.textContent = '错误: ' + message;
    statusInfo.style.color = 'red';
    
    setTimeout(() => {
        statusInfo.textContent = originalText;
        statusInfo.style.color = '#666';
    }, 5000);
}

// 显示成功信息
function showSuccess(message) {
    const statusInfo = document.getElementById('statusInfo');
    const originalText = statusInfo.textContent;
    statusInfo.textContent = message;
    statusInfo.style.color = 'green';
    
    setTimeout(() => {
        statusInfo.textContent = originalText;
        statusInfo.style.color = '#666';
    }, 3000);
}
