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

// 静态比价数据（来自用户提供的截图）
const staticCompareData = {
    coins: [
        { symbol: 'OKB', highPrice: 235.51972, highCount: 1226, lowPrice: 162.60563, lowCount: 357, highRatio: 72.6, lowRatio: 106.12 },
        { symbol: 'DOT', highPrice: 4.883676, highCount: 2706, lowPrice: 3.02496, lowCount: 373, highRatio: 65.94, lowRatio: 106.46 },
        { symbol: 'LINK', highPrice: 26.37, highCount: 5919, lowPrice: 17.5507, lowCount: 373, highRatio: 71.8, lowRatio: 114.47 },
        { symbol: 'ADA', highPrice: 0.953965, highCount: 3487, lowPrice: 0.6447, lowCount: 373, highRatio: 71.75, lowRatio: 106.17 },
        { symbol: 'FIL', highPrice: 2.65668197, highCount: 1463, lowPrice: 1.53535, lowCount: 373, highRatio: 62.8, lowRatio: 108.24 },
        { symbol: 'XLM', highPrice: 0.41770, highCount: 5139, lowPrice: 0.31372, lowCount: 373, highRatio: 79.24, lowRatio: 105.5 },
        { symbol: 'HBAR', highPrice: 0.255267, highCount: 3487, lowPrice: 0.16749, lowCount: 373, highRatio: 71.87, lowRatio: 109.24 },
        { symbol: 'BCH', highPrice: 650.8239, highCount: 2677, lowPrice: 459.09296, lowCount: 373, highRatio: 86.45, lowRatio: 122.56 },
        { symbol: 'ETC', highPrice: 24.32, highCount: 5916, lowPrice: 14.48451, lowCount: 1296, highRatio: 68.91, lowRatio: 115.69 },
        { symbol: 'TON', highPrice: 3.392, highCount: 5916, lowPrice: 2.12076, lowCount: 373, highRatio: 66.5, lowRatio: 106.47 },
        { symbol: 'TRX', highPrice: 0.36644, highCount: 5916, lowPrice: 0.29499, lowCount: 296, highRatio: 82.29, lowRatio: 102.22 },
        { symbol: 'SUI', highPrice: 3.981056, highCount: 2943, lowPrice: 2.45677, lowCount: 373, highRatio: 67.12, lowRatio: 109.76 },
        { symbol: 'DOGE', highPrice: 0.307154, highCount: 3487, lowPrice: 0.19456, lowCount: 373, highRatio: 67.59, lowRatio: 106.71 },
        { symbol: 'SOL', highPrice: 253.3591, highCount: 2753, lowPrice: 186.38873, lowCount: 443, highRatio: 80.74, lowRatio: 109.76 },
        { symbol: 'LTC', highPrice: 135.56901, highCount: 783, lowPrice: 92.58169, lowCount: 510, highRatio: 73.92, lowRatio: 108.25 },
        { symbol: 'BNB', highPrice: 1377.4831, highCount: 682, lowPrice: 820.7, lowCount: 5916, highRatio: 84.13, lowRatio: 141.17 },
        { symbol: 'XRP', highPrice: 3.190211, highCount: 3506, lowPrice: 2.3165, lowCount: 512, highRatio: 83.1, lowRatio: 109.7 },
        { symbol: 'BTC', highPrice: 125370.2, highCount: 1215, lowPrice: 107095.3, lowCount: 5203, highRatio: 92.52, lowRatio: 107.54 },
        { symbol: 'ETH', highPrice: 4830, highCount: 5916, lowPrice: 3858.28873, lowCount: 1839, highRatio: 87.67, lowRatio: 109.75 },
        { symbol: 'CRO', highPrice: 0.385774, highCount: 5719, lowPrice: 0.14583, lowCount: 377, highRatio: 40.52, lowRatio: 107.19 },
        { symbol: 'CFX', highPrice: 0.187839, highCount: 2743, lowPrice: 0.10972, lowCount: 164, highRatio: 62.35, lowRatio: 106.79 },
        { symbol: 'CRV', highPrice: 0.862873, highCount: 3850, lowPrice: 0.51941, lowCount: 373, highRatio: 68.46, lowRatio: 113.74 },
        { symbol: 'APT', highPrice: 5.49327, highCount: 1441, lowPrice: 3.14277, lowCount: 373, highRatio: 65.51, lowRatio: 114.5 },
        { symbol: 'NEAR', highPrice: 3.324084, highCount: 2710, lowPrice: 2.15015, lowCount: 373, highRatio: 72.15, lowRatio: 111.55 },
        { symbol: 'UNI', highPrice: 10.37119, highCount: 3483, lowPrice: 6.17544, lowCount: 164, highRatio: 65.37, lowRatio: 109.79 },
        { symbol: 'AAVE', highPrice: 322.6535, highCount: 3790, lowPrice: 213.46901, lowCount: 681, highRatio: 76.02, lowRatio: 114.9 },
        { symbol: 'STX', highPrice: 0.702112, highCount: 3847, lowPrice: 0.43969, lowCount: 379, highRatio: 67.64, lowRatio: 108.01 },
        { symbol: 'TAO', highPrice: 476.82394, highCount: 406, lowPrice: 293.10704, lowCount: 1706, highRatio: 86.84, lowRatio: 140.95 },
        { symbol: 'LDO', highPrice: 1.354929, highCount: 2662, lowPrice: 0.894, lowCount: 782, highRatio: 71.83, lowRatio: 108.65 }
    ]
};

// 加载比价数据（从API获取真实数据）
async function loadCompareData() {
    try {
        console.log('正在加载比价数据...');
        
        // 从API获取数据
        const response = await axios.get('/api/compare');
        const apiData = response.data;
        
        // API已经返回了正确格式的coins数组
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
                lastUpdated: coin.last_updated
            }))
        };
        
        // 渲染三个表格
        renderLeftTable(currentData);
        renderCenterTable(currentData);
        renderRightTables(currentData);
        
        // 更新时间戳
        const updateTime = apiData.lastUpdated 
            ? new Date(apiData.lastUpdated).toLocaleString('zh-CN')
            : new Date().toLocaleString('zh-CN');
        
        document.getElementById('leftUpdateTime').textContent = updateTime;
        document.getElementById('centerUpdateTime').textContent = updateTime;
        document.getElementById('rightTopTime').textContent = updateTime;
        
        console.log('比价数据加载完成，共', currentData.coins.length, '个币种');
        showSuccess('数据刷新成功');
        
    } catch (error) {
        console.error('加载数据失败:', error);
        showError('加载数据失败: ' + error.message);
        
        // 如果API失败，回退到静态数据
        console.log('回退到静态数据');
        currentData = staticCompareData;
        renderLeftTable(currentData);
        renderCenterTable(currentData);
        renderRightTables(currentData);
        
        const now = new Date().toLocaleString('zh-CN');
        document.getElementById('leftUpdateTime').textContent = now + ' (静态)';
        document.getElementById('centerUpdateTime').textContent = now + ' (静态)';
        document.getElementById('rightTopTime').textContent = now + ' (静态)';
    }
}

// 渲染左侧主表格 - 使用静态数据
function renderLeftTable(data) {
    const tbody = document.getElementById('leftTableBody');
    
    if (!data.coins || data.coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">暂无数据</td></tr>';
        return;
    }
    
    // 应用筛选
    let filteredCoins = data.coins;
    if (filterText) {
        filteredCoins = data.coins.filter(c => c.symbol.includes(filterText));
    }
    
    // 生成表格行
    let html = '';
    filteredCoins.forEach((coin, index) => {
        // 计算占比的颜色样式
        // 最高占比：绿色 > 80%, 黄色 60-80%
        let ratioHighClass = '';
        if (coin.highRatio > 80) {
            ratioHighClass = 'green-bg';
        } else if (coin.highRatio > 60) {
            ratioHighClass = 'yellow-bg';
        }
        
        // 最低占比：绿色 > 110%, 黄色 100-110%
        let ratioLowClass = '';
        if (coin.lowRatio > 110) {
            ratioLowClass = 'green-bg';
        } else if (coin.lowRatio > 100) {
            ratioLowClass = 'yellow-bg';
        }
        
        // 计次列统一使用黄色背景
        html += `
            <tr data-symbol="${coin.symbol}">
                <td>${coin.symbol}</td>
                <td>${coin.highPrice.toFixed(6)}</td>
                <td class="yellow-bg">${coin.highCount}</td>
                <td>${coin.lowPrice.toFixed(6)}</td>
                <td class="yellow-bg">${coin.lowCount}</td>
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
    
    if (!data.coins || data.coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">暂无数据</td></tr>';
        return;
    }
    
    // 按最高占比排序，显示前15个
    const sortedCoins = [...data.coins].sort((a, b) => b.highRatio - a.highRatio).slice(0, 15);
    
    let html = '';
    sortedCoins.forEach(coin => {
        // 计算当前价格（基于最高价格和占比）
        const currentPrice = (coin.highPrice * coin.highRatio / 100).toFixed(6);
        
        // 根据占比判断趋势
        let trendText = '持平';
        let trendClass = '';
        if (coin.highRatio > 85) {
            trendText = '接近最高';
            trendClass = 'green-bg';
        } else if (coin.highRatio > 70) {
            trendText = '中位震荡';
            trendClass = 'yellow-bg';
        } else if (coin.highRatio < 60) {
            trendText = '低位徘徊';
            trendClass = 'red-bg';
        } else {
            trendText = '相对低位';
            trendClass = 'light-yellow-bg';
        }
        
        const ratioClass = coin.highRatio > 80 ? 'green-bg' : (coin.highRatio > 65 ? 'yellow-bg' : '');
        
        html += `
            <tr>
                <td>${coin.symbol}</td>
                <td class="${ratioClass}">${coin.highRatio.toFixed(2)}%</td>
                <td>$${currentPrice}</td>
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
    
    if (!data.coins || data.coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding: 20px;">暂无数据</td></tr>';
        return;
    }
    
    // 计算统计数据
    const totalCoins = data.coins.length;
    
    // 计算平均占比
    const avgHighRatio = data.coins.reduce((sum, coin) => sum + coin.highRatio, 0) / totalCoins;
    const avgLowRatio = data.coins.reduce((sum, coin) => sum + coin.lowRatio, 0) / totalCoins;
    
    // 统计高占比/低占比币种数
    const highRatioCount = data.coins.filter(c => c.highRatio > 80).length;
    const lowRatioCount = data.coins.filter(c => c.lowRatio > 110).length;
    
    // 找出最高占比和最低占比
    const maxHighRatio = data.coins.reduce((max, coin) => 
        coin.highRatio > max.highRatio ? coin : max
    , data.coins[0]);
    
    const maxLowRatio = data.coins.reduce((max, coin) => 
        coin.lowRatio > max.lowRatio ? coin : max
    , data.coins[0]);
    
    // 计算总计次
    const totalHighCount = data.coins.reduce((sum, coin) => sum + coin.highCount, 0);
    const totalLowCount = data.coins.reduce((sum, coin) => sum + coin.lowCount, 0);
    
    let html = `
        <tr>
            <td>币种总数</td>
            <td style="text-align: right; font-weight: bold;">${totalCoins}</td>
        </tr>
        <tr>
            <td>高位币种</td>
            <td style="text-align: right;" class="green-bg">${highRatioCount} (${(highRatioCount/totalCoins*100).toFixed(1)}%)</td>
        </tr>
        <tr>
            <td>低位币种</td>
            <td style="text-align: right;" class="yellow-bg">${totalCoins - highRatioCount} (${((totalCoins-highRatioCount)/totalCoins*100).toFixed(1)}%)</td>
        </tr>
        <tr>
            <td>平均最高占比</td>
            <td style="text-align: right;" class="yellow-bg">${avgHighRatio.toFixed(2)}%</td>
        </tr>
        <tr>
            <td>平均最低占比</td>
            <td style="text-align: right;" class="green-bg">${avgLowRatio.toFixed(2)}%</td>
        </tr>
        <tr>
            <td>总计次(高)</td>
            <td style="text-align: right; font-weight: bold;">${totalHighCount.toLocaleString()}</td>
        </tr>
        <tr>
            <td>总计次(低)</td>
            <td style="text-align: right; font-weight: bold;">${totalLowCount.toLocaleString()}</td>
        </tr>
        <tr>
            <td>最高占比币种</td>
            <td style="text-align: right;" class="green-bg">${maxHighRatio.symbol}: ${maxHighRatio.highRatio.toFixed(2)}%</td>
        </tr>
        <tr>
            <td>最低占比币种</td>
            <td style="text-align: right;" class="green-bg">${maxLowRatio.symbol}: ${maxLowRatio.lowRatio.toFixed(2)}%</td>
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
