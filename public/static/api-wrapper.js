/**
 * API包装器 - 将所有API调用统一通过APIManager管理
 * 
 * 使用方法：
 * const result = await API.get('/api/accounts', { params: { limit: 10 }, priority: 8 });
 * const result = await API.post('/api/trades', { data: { symbol: 'BTC' }, priority: 9 });
 */

const API = {
  /**
   * GET请求
   */
  async get(url, options = {}) {
    const {
      params = {},
      priority = 5,
      cache = true,
      dedupe = true,
      tag = `GET ${url}`
    } = options;
    
    return window.apiManager.request({
      url,
      method: 'GET',
      params,
      priority,
      cache,
      dedupe,
      tag
    });
  },
  
  /**
   * POST请求
   */
  async post(url, options = {}) {
    const {
      data = {},
      priority = 7, // POST通常优先级较高
      cache = false, // POST通常不缓存
      dedupe = false, // POST通常不去重
      tag = `POST ${url}`
    } = options;
    
    return window.apiManager.request({
      url,
      method: 'POST',
      data,
      priority,
      cache,
      dedupe,
      tag
    });
  },
  
  /**
   * PUT请求
   */
  async put(url, options = {}) {
    const {
      data = {},
      priority = 7,
      cache = false,
      dedupe = false,
      tag = `PUT ${url}`
    } = options;
    
    return window.apiManager.request({
      url,
      method: 'PUT',
      data,
      priority,
      cache,
      dedupe,
      tag
    });
  },
  
  /**
   * DELETE请求
   */
  async delete(url, options = {}) {
    const {
      priority = 7,
      cache = false,
      dedupe = false,
      tag = `DELETE ${url}`
    } = options;
    
    return window.apiManager.request({
      url,
      method: 'DELETE',
      priority,
      cache,
      dedupe,
      tag
    });
  }
};

/**
 * API优先级常量
 * 
 * 使用示例：
 * API.get('/api/accounts', { priority: API_PRIORITY.CRITICAL });
 */
const API_PRIORITY = {
  CRITICAL: 10,   // 关键操作（如交易执行）
  HIGH: 8,        // 高优先级（如账户数据）
  NORMAL: 5,      // 普通优先级（如信号池）
  LOW: 3,         // 低优先级（如历史数据）
  BACKGROUND: 1   // 后台任务（如统计数据）
};

// 导出到全局
window.API = API;
window.API_PRIORITY = API_PRIORITY;

console.log('✅ [API Wrapper] 已加载: window.API, window.API_PRIORITY');
