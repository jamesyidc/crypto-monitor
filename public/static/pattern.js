// 当前选中的tab
let currentTab = 'surge';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadPatterns('surge');
});

// 切换Tab
function switchTab(tab) {
  currentTab = tab;
  
  // 更新Tab样式
  if (tab === 'surge') {
    document.getElementById('tabSurge').className = 'px-6 py-3 font-bold text-green-600 border-b-2 border-green-600';
    document.getElementById('tabCrash').className = 'px-6 py-3 font-bold text-gray-500 hover:text-red-600';
    document.getElementById('surgeContent').classList.remove('hidden');
    document.getElementById('crashContent').classList.add('hidden');
  } else {
    document.getElementById('tabSurge').className = 'px-6 py-3 font-bold text-gray-500 hover:text-green-600';
    document.getElementById('tabCrash').className = 'px-6 py-3 font-bold text-red-600 border-b-2 border-red-600';
    document.getElementById('surgeContent').classList.add('hidden');
    document.getElementById('crashContent').classList.remove('hidden');
  }
  
  loadPatterns(tab);
}

// 加载统计数据
async function loadStats() {
  try {
    const response = await fetch('/api/pattern/stats');
    const data = await response.json();
    
    if (data.success) {
      const { surge, crash } = data.stats;
      
      // 起涨统计
      document.getElementById('surgeTotal').textContent = surge.total || 0;
      document.getElementById('surgeAvgChange').textContent = surge.avg_change ? `+${surge.avg_change.toFixed(2)}%` : '-';
      document.getElementById('surgeV1').textContent = `${surge.volume_surge_count || 0} (${((surge.volume_surge_count / surge.total) * 100).toFixed(1)}%)`;
      document.getElementById('surgeBreakout').textContent = `${surge.breakout_count || 0} (${((surge.breakout_count / surge.total) * 100).toFixed(1)}%)`;
      document.getElementById('surgeContinuous').textContent = `${surge.continuous_count || 0} (${((surge.continuous_count / surge.total) * 100).toFixed(1)}%)`;
      
      // 起跌统计
      document.getElementById('crashTotal').textContent = crash.total || 0;
      document.getElementById('crashAvgChange').textContent = crash.avg_change ? `${crash.avg_change.toFixed(2)}%` : '-';
      document.getElementById('crashV1').textContent = `${crash.volume_surge_count || 0} (${((crash.volume_surge_count / crash.total) * 100).toFixed(1)}%)`;
      document.getElementById('crashBreakout').textContent = `${crash.breakout_count || 0} (${((crash.breakout_count / crash.total) * 100).toFixed(1)}%)`;
      document.getElementById('crashContinuous').textContent = `${crash.continuous_count || 0} (${((crash.continuous_count / crash.total) * 100).toFixed(1)}%)`;
    }
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

// 加载模式列表
async function loadPatterns(type) {
  const contentId = type === 'surge' ? 'surgeContent' : 'crashContent';
  const content = document.getElementById(contentId);
  
  content.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin text-3xl mb-4"></i><p>加载中...</p></div>';
  
  try {
    const response = await fetch(`/api/pattern/${type}`);
    const data = await response.json();
    
    if (data.success && data.patterns.length > 0) {
      content.innerHTML = data.patterns.map(p => renderPattern(p, type)).join('');
    } else {
      content.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-inbox text-3xl mb-4"></i><p>暂无数据，请先点击"重新分析"</p></div>';
    }
  } catch (error) {
    console.error('加载模式失败:', error);
    content.innerHTML = '<div class="text-center py-8 text-red-500"><i class="fas fa-exclamation-triangle text-3xl mb-4"></i><p>加载失败</p></div>';
  }
}

// 渲染单个模式卡片
function renderPattern(pattern, type) {
  const isGreen = type === 'surge';
  const colorClass = isGreen ? 'green' : 'red';
  const iconClass = isGreen ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
  const features = pattern.features;
  
  // 时间格式化
  const startTime = new Date(pattern.start_time).toLocaleString('zh-CN');
  const endTime = new Date(pattern.end_time).toLocaleString('zh-CN');
  
  return `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <h3 class="text-xl font-bold text-${colorClass}-600">
            <i class="fas ${iconClass} mr-2"></i>${pattern.symbol}
          </h3>
          <span class="text-2xl font-bold text-${colorClass}-600">
            ${pattern.total_change >= 0 ? '+' : ''}${pattern.total_change.toFixed(2)}%
          </span>
        </div>
        <div class="text-sm text-gray-500">
          ${pattern.kline_count} 根K线
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div><span class="text-gray-500">起始时间:</span> ${startTime}</div>
        <div><span class="text-gray-500">结束时间:</span> ${endTime}</div>
      </div>
      
      <div class="border-t pt-4">
        <h4 class="font-bold text-gray-700 mb-3">特征详情</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <!-- 成交量特征 -->
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">V1成交量</div>
            <div class="font-bold ${features.has_volume_v1 ? 'text-red-600' : 'text-gray-400'}">
              ${features.volume_v1_count > 0 ? `✓ ${features.volume_v1_count}次` : '无'}
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">V2成交量</div>
            <div class="font-bold ${features.volume_v2_count > 0 ? 'text-orange-600' : 'text-gray-400'}">
              ${features.volume_v2_count > 0 ? `✓ ${features.volume_v2_count}次` : '无'}
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">成交量倍数</div>
            <div class="font-bold">${features.volume_surge_ratio}x</div>
          </div>
          
          <!-- 形态特征 -->
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">${isGreen ? '阳线数量' : '阴线数量'}</div>
            <div class="font-bold text-${colorClass}-600">
              ${isGreen ? features.green_count : features.red_count} / ${pattern.kline_count}
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">连续同向</div>
            <div class="font-bold">
              ${isGreen ? features.continuous_green : features.continuous_red}根
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">平均涨跌幅</div>
            <div class="font-bold text-${colorClass}-600">${features.avg_change}%</div>
          </div>
          
          <!-- 价格特征 -->
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">${isGreen ? '最大单根涨幅' : '最大单根跌幅'}</div>
            <div class="font-bold text-${colorClass}-600">
              ${isGreen ? features.max_single_change : features.min_single_change}%
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">${isGreen ? '突破幅度' : '跌破幅度'}</div>
            <div class="font-bold text-${colorClass}-600">
              ${isGreen ? features.breakout_percent : features.crash_percent}%
            </div>
          </div>
          
          <!-- 初期特征 -->
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">初期3根变化</div>
            <div class="font-bold text-${colorClass}-600">${features.early_change}%</div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">初期成交量</div>
            <div class="font-bold ${features.early_volume_surge ? 'text-red-600' : 'text-gray-400'}">
              ${features.early_volume_surge ? '✓ 放量' : '无放量'}
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">初期${isGreen ? '阳线' : '阴线'}</div>
            <div class="font-bold text-${colorClass}-600">
              ${isGreen ? features.early_green_count : features.early_red_count} / 3
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 重新分析
async function analyzePatterns() {
  const btn = document.getElementById('analyzeBtn');
  const originalText = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>分析中...';
  
  try {
    const response = await fetch('/api/pattern/analyze', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      alert(`分析完成！\n起涨模式: ${data.results.surge} 个\n起跌模式: ${data.results.crash} 个`);
      loadStats();
      loadPatterns(currentTab);
    } else {
      alert('分析失败: ' + data.error);
    }
  } catch (error) {
    console.error('分析失败:', error);
    alert('分析失败: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}
