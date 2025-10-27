// 存储所有设置
let allSettings = [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});

// 加载所有设置
async function loadSettings() {
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();
    
    if (data.success) {
      allSettings = data.settings;
      renderSettings();
    } else {
      showError('加载设置失败: ' + data.error);
    }
  } catch (error) {
    console.error('加载设置失败:', error);
    showError('加载设置失败: ' + error.message);
  }
}

// 渲染设置表单
function renderSettings() {
  // 按分类分组
  const categories = {
    surge_crash: [],
    extremes: [],
    risk: [],
    indicators: [],
    general: []
  };
  
  allSettings.forEach(setting => {
    if (categories[setting.category]) {
      categories[setting.category].push(setting);
    }
  });
  
  // 渲染各分类
  renderCategory('surgeCrashSettings', categories.surge_crash);
  renderCategory('extremesSettings', categories.extremes);
  renderCategory('riskSettings', categories.risk);
  renderCategory('indicatorsSettings', categories.indicators);
  renderCategory('generalSettings', categories.general);
}

// 渲染单个分类的设置
function renderCategory(containerId, settings) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = settings.map(s => renderSettingItem(s)).join('');
}

// 渲染单个设置项
function renderSettingItem(setting) {
  const inputType = setting.setting_type === 'boolean' ? 'checkbox' : 'number';
  const inputValue = setting.setting_type === 'boolean' 
    ? (setting.setting_value === 'true' ? 'checked' : '')
    : setting.setting_value;
  
  return `
    <div class="border border-gray-200 rounded-lg p-4">
      <label class="block">
        <div class="flex items-start justify-between mb-2">
          <div>
            <span class="font-bold text-gray-700">${setting.display_name}</span>
            <p class="text-xs text-gray-500 mt-1">${setting.description || ''}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${setting.setting_type === 'boolean' 
            ? `<input type="checkbox" ${inputValue} 
                 data-key="${setting.setting_key}" 
                 class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">`
            : `<input type="${inputType}" 
                 value="${inputValue}" 
                 data-key="${setting.setting_key}" 
                 step="any"
                 class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">`
          }
          ${setting.setting_type === 'number' 
            ? `<span class="text-sm text-gray-500 whitespace-nowrap">${getUnit(setting.setting_key)}</span>`
            : ''
          }
        </div>
      </label>
    </div>
  `;
}

// 获取单位
function getUnit(key) {
  if (key.includes('threshold') || key.includes('ratio')) return '';
  if (key.includes('interval')) return 'ms';
  if (key.includes('period')) return '周期';
  return '';
}

// 保存设置
async function saveSettings() {
  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.innerHTML;
  
  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
    
    // 收集所有输入框的值
    const inputs = document.querySelectorAll('input[data-key]');
    const updates = [];
    
    inputs.forEach(input => {
      const key = input.getAttribute('data-key');
      let value;
      
      if (input.type === 'checkbox') {
        value = input.checked ? 'true' : 'false';
      } else {
        value = input.value;
      }
      
      updates.push({ key, value });
    });
    
    // 批量更新
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: updates })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('设置已保存！');
      // 重新加载设置以确保显示最新值
      setTimeout(() => loadSettings(), 500);
    } else {
      showError('保存失败: ' + data.error);
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    showError('保存失败: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

// 重置为默认值
async function resetSettings() {
  if (!confirm('确定要恢复所有设置为默认值吗？此操作不可撤销！')) {
    return;
  }
  
  const resetBtn = document.getElementById('resetBtn');
  const originalText = resetBtn.innerHTML;
  
  try {
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>重置中...';
    
    const response = await fetch('/api/settings/reset', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('设置已恢复为默认值！');
      // 重新加载设置
      setTimeout(() => loadSettings(), 500);
    } else {
      showError('重置失败: ' + data.error);
    }
  } catch (error) {
    console.error('重置设置失败:', error);
    showError('重置失败: ' + error.message);
  } finally {
    resetBtn.disabled = false;
    resetBtn.innerHTML = originalText;
  }
}

// 显示成功消息
function showSuccess(message) {
  showMessage(message, 'success');
}

// 显示错误消息
function showError(message) {
  showMessage(message, 'error');
}

// 显示消息
function showMessage(message, type) {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  
  const toast = document.createElement('div');
  toast.className = `fixed top-20 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`;
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
