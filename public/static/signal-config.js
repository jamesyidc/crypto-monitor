// 全局状态
let allConfigs = [];
let hasChanges = false;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfigs();
  
  document.getElementById('refreshBtn').addEventListener('click', loadConfigs);
  document.getElementById('saveBtn').addEventListener('click', saveConfigs);
});

// 加载配置
async function loadConfigs() {
  try {
    showLoading();
    
    const response = await axios.get('/api/signal-config');
    
    if (response.data.success) {
      allConfigs = response.data.configs;
      renderConfigs();
      hasChanges = false;
      updateSaveButton();
      showStatus('success', '配置加载成功', '已从服务器获取最新配置');
    } else {
      showStatus('error', '加载失败', response.data.error || '未知错误');
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    showStatus('error', '加载失败', error.message);
  }
}

// 渲染配置
function renderConfigs() {
  const tradingConfigs = allConfigs.filter(c => c.signal_category === 'trading');
  const alertConfigs = allConfigs.filter(c => c.signal_category === 'alert');
  
  renderConfigGroup('tradingConfig', tradingConfigs);
  renderConfigGroup('alertConfig', alertConfigs);
}

// 渲染配置组
function renderConfigGroup(containerId, configs) {
  const container = document.getElementById(containerId);
  
  if (configs.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center py-4">暂无配置项</div>';
    return;
  }
  
  container.innerHTML = configs.map(config => {
    const isEnabled = config.enabled === 1;
    const bgColor = isEnabled ? 'bg-green-50' : 'bg-gray-50';
    const borderColor = isEnabled ? 'border-green-200' : 'border-gray-200';
    
    return `
      <div class="flex items-center justify-between p-4 border ${borderColor} ${bgColor} rounded-lg transition-all">
        <div class="flex items-center gap-4">
          <div class="w-3 h-3 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}"></div>
          <div>
            <div class="font-semibold text-gray-800">${config.signal_type}</div>
            <div class="text-xs text-gray-500">
              更新时间: ${new Date(config.updated_at).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
        
        <label class="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            class="sr-only peer" 
            ${isEnabled ? 'checked' : ''}
            data-category="${config.signal_category}"
            data-type="${config.signal_type}"
            onchange="handleToggle(this)"
          >
          <div class="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
          <span class="ml-3 text-sm font-medium ${isEnabled ? 'text-green-700' : 'text-gray-500'}">
            ${isEnabled ? '启用' : '禁用'}
          </span>
        </label>
      </div>
    `;
  }).join('');
}

// 处理开关切换
function handleToggle(checkbox) {
  const category = checkbox.dataset.category;
  const type = checkbox.dataset.type;
  const enabled = checkbox.checked;
  
  // 更新本地配置
  const config = allConfigs.find(c => 
    c.signal_category === category && c.signal_type === type
  );
  
  if (config) {
    config.enabled = enabled ? 1 : 0;
    hasChanges = true;
    updateSaveButton();
    
    // 重新渲染（更新UI）
    renderConfigs();
  }
}

// 更新保存按钮状态
function updateSaveButton() {
  const saveBtn = document.getElementById('saveBtn');
  if (hasChanges) {
    saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
    saveBtn.classList.add('bg-orange-600', 'hover:bg-orange-700', 'animate-pulse');
    saveBtn.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>有未保存的更改';
  } else {
    saveBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700', 'animate-pulse');
    saveBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>保存配置';
  }
}

// 保存配置
async function saveConfigs() {
  if (!hasChanges) {
    showStatus('info', '无需保存', '配置未发生变化');
    return;
  }
  
  try {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
    
    // 准备批量更新的数据
    const configs = allConfigs.map(c => ({
      signal_category: c.signal_category,
      signal_type: c.signal_type,
      enabled: c.enabled === 1
    }));
    
    const response = await axios.post('/api/signal-config/batch', { configs });
    
    if (response.data.success) {
      hasChanges = false;
      updateSaveButton();
      showStatus('success', '保存成功', response.data.message);
      
      // 重新加载配置以确保同步
      setTimeout(() => loadConfigs(), 1000);
    } else {
      showStatus('error', '保存失败', response.data.error || '未知错误');
    }
  } catch (error) {
    console.error('保存配置失败:', error);
    showStatus('error', '保存失败', error.message);
  } finally {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = false;
    updateSaveButton();
  }
}

// 显示加载状态
function showLoading() {
  document.getElementById('tradingConfig').innerHTML = 
    '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i><div class="mt-2 text-gray-600">加载中...</div></div>';
  document.getElementById('alertConfig').innerHTML = 
    '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i><div class="mt-2 text-gray-600">加载中...</div></div>';
}

// 显示状态消息
function showStatus(type, title, text) {
  const statusMessage = document.getElementById('statusMessage');
  const statusTitle = document.getElementById('statusTitle');
  const statusText = document.getElementById('statusText');
  const icon = statusMessage.querySelector('i');
  
  // 设置颜色和图标
  const colors = {
    success: { border: 'border-green-500', icon: 'fa-check-circle text-green-500', title: 'text-green-800' },
    error: { border: 'border-red-500', icon: 'fa-times-circle text-red-500', title: 'text-red-800' },
    info: { border: 'border-blue-500', icon: 'fa-info-circle text-blue-500', title: 'text-blue-800' }
  };
  
  const color = colors[type] || colors.info;
  
  // 更新样式
  const container = statusMessage.querySelector('.bg-white');
  container.className = `bg-white rounded-lg shadow-lg p-4 border-l-4 ${color.border}`;
  icon.className = `fas ${color.icon} text-2xl mr-3`;
  statusTitle.className = `font-bold ${color.title}`;
  statusTitle.textContent = title;
  statusText.textContent = text;
  
  // 显示消息
  statusMessage.classList.remove('hidden');
  
  // 3秒后自动隐藏
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 3000);
}
