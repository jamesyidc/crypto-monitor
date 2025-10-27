// 比价比对页面 JavaScript

let currentData = null;
let filterText = '';

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
}

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

// 渲染左侧主表格
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
            change_percent: detail ? detail.change_percent : 0,
            change_24h: detail ? detail.change_24h : 0,
            is_surge: detail ? detail.is_surge : 0,
            is_crash: detail ? detail.is_crash : 0,
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
    
    // 按等级排序
    filteredCoins.sort((a, b) => a.level - b.level);
    
    // 生成表格行
    let html = '';
    filteredCoins.forEach((coin, index) => {
        // 计算计次（模拟数据）
        const highCount = Math.floor(Math.random() * 1000) + 100;
        const lowCount = Math.floor(Math.random() * 1000) + 100;
        
        // 计算涨跌颜色
        const changeClass = coin.change_percent > 0 ? 'green-bg' : (coin.change_percent < 0 ? 'red-bg' : '');
        const ratioHighClass = coin.highRatio > 100 ? 'yellow-bg' : (coin.highRatio > 90 ? 'light-yellow-bg' : '');
        const ratioLowClass = coin.lowRatio > 110 ? 'green-bg' : (coin.lowRatio < 70 ? 'red-bg' : (coin.lowRatio > 100 ? 'yellow-bg' : ''));
        
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

// 渲染中间历史记录表格
function renderCenterTable(data) {
    const tbody = document.getElementById('centerTableBody');
    
    if (!data.coinDetails || data.coinDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">暂无数据</td></tr>';
        return;
    }
    
    // 获取所有有状态变化的币种
    const records = [];
    
    data.coinDetails.forEach(coin => {
        // 创建新高记录
        if (Math.random() > 0.7) {  // 模拟部分币种有新高
            records.push({
                symbol: coin.symbol,
                time: new Date(Date.now() - Math.random() * 3600000).toLocaleString('zh-CN', { 
                    year: 'numeric',
                    month: '2-digit', 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                status: '创新高',
                value: Math.random() < 0.5 ? coin.price.toFixed(6) : (coin.price * 0.98).toFixed(6)
            });
        }
    });
    
    // 按时间倒序排列
    records.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // 只显示最近30条
    const recentRecords = records.slice(0, 30);
    
    let html = '';
    recentRecords.forEach(record => {
        html += `
            <tr>
                <td>${record.symbol}</td>
                <td class="time-column">${record.time}</td>
                <td style="text-align: center;">${record.status}</td>
                <td>${record.value}</td>
            </tr>
        `;
    });
    
    if (html === '') {
        html = '<tr><td colspan="4" style="text-align:center; padding: 20px;">暂无历史记录</td></tr>';
    }
    
    tbody.innerHTML = html;
}

// 渲染右侧两个表格
function renderRightTables(data) {
    // 右上：新高统计
    renderRightTopTable(data);
    
    // 右下：创新高榜
    renderRightBottomTable(data);
}

// 渲染右上表格：新高统计
function renderRightTopTable(data) {
    const tbody = document.getElementById('rightTopTableBody');
    
    if (!data.coinDetails || data.coinDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">暂无数据</td></tr>';
        return;
    }
    
    // 生成统计数据（模拟）
    const stats = data.coinDetails.map(coin => ({
        symbol: coin.symbol,
        today: Math.floor(Math.random() * 30),
        three_day: Math.floor(Math.random() * 50),
        seven_day: Math.floor(Math.random() * 100)
    }));
    
    // 按7天统计排序
    stats.sort((a, b) => b.seven_day - a.seven_day);
    
    let html = '';
    stats.forEach(stat => {
        html += `
            <tr>
                <td>${stat.symbol}</td>
                <td>${stat.today}</td>
                <td>${stat.three_day}</td>
                <td>${stat.seven_day}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 渲染右下表格：创新高榜
function renderRightBottomTable(data) {
    const tbody = document.getElementById('rightBottomTableBody');
    
    if (!data.coinDetails || data.coinDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 10px;">暂无数据</td></tr>';
        return;
    }
    
    // 生成榜单数据（按7天新高次数排序，模拟）
    const ranking = data.coinDetails.map(coin => ({
        symbol: coin.symbol,
        count: Math.floor(Math.random() * 100)
    }));
    
    ranking.sort((a, b) => b.count - a.count);
    
    // 只显示前10名
    const topRanking = ranking.slice(0, 10);
    
    let html = '';
    topRanking.forEach((item, index) => {
        html += `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.symbol}</td>
                <td>${item.count}</td>
            </tr>
        `;
    });
    
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
