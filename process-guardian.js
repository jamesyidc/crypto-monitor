#!/usr/bin/env node

/**
 * 🛡️ 进程守护者 (Process Guardian)
 * 
 * 功能：
 * 1. 监控所有关键后台进程的运行状态
 * 2. 自动检测进程崩溃或异常
 * 3. 自动重启失败的进程
 * 4. 提供Web控制台查看日志和状态
 * 5. 每5分钟执行一次健康检查
 * 
 * 监控的进程列表：
 * - kline-scheduler: K线数据同步调度器（每5分钟同步K线数据）
 * - analysis-scheduler: 价格分析调度器（每5分钟执行价格分析）
 * - snapshot-scheduler: 数据快照调度器（每10分钟保存首页数据快照）
 * - consecutive-rise-scheduler: 连续上涨统计调度器（每15分钟统计连续上涨）
 * - health-monitor: 系统健康监控器（每4分钟检查系统状态）
 * 
 * 使用方法：
 * node process-guardian.js
 * 
 * 或使用PM2：
 * pm2 start process-guardian.js --name process-guardian
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 配置 ====================

const CONFIG = {
  // 检查间隔：5分钟
  checkInterval: 5 * 60 * 1000,
  
  // Web控制台端口
  webPort: 3001,
  
  // 日志文件
  logFile: 'process-guardian.log',
  statusFile: 'public/static/process-status.json',
  
  // 监控的进程配置
  processes: [
    {
      name: 'kline-scheduler',
      description: 'K线数据同步调度器 - 每5分钟从OKX API同步最新K线数据',
      command: 'node scheduler.js',
      checkMethod: 'pm2',
      healthCheck: {
        type: 'api',
        url: 'http://localhost:3000/api/dashboard',
        expectedFields: ['latestRound', 'coinDetails']
      },
      priority: 1, // 最高优先级
      restartDelay: 5000
    },
    {
      name: 'analysis-scheduler',
      description: '价格分析调度器 - 每5分钟执行价格变动分析和信号检测',
      command: 'node analysis-scheduler.js',
      checkMethod: 'pm2',
      healthCheck: {
        type: 'api',
        url: 'http://localhost:3000/api/signal/all',
        timeout: 10000
      },
      priority: 2,
      restartDelay: 5000
    },
    {
      name: 'snapshot-scheduler',
      description: '数据快照调度器 - 每10分钟保存完整首页数据用于历史回溯',
      command: 'node snapshot-scheduler.js',
      checkMethod: 'pm2',
      priority: 3,
      restartDelay: 5000
    },
    {
      name: 'consecutive-rise-scheduler',
      description: '连续上涨统计调度器 - 每15分钟统计币种连续上涨趋势',
      command: 'node consecutive-rise-scheduler.js',
      checkMethod: 'pm2',
      priority: 4,
      restartDelay: 5000
    },
    {
      name: 'health-monitor',
      description: '系统健康监控器 - 每4分钟检查系统整体健康状态',
      command: 'node health-monitor.js',
      checkMethod: 'pm2',
      healthCheck: {
        type: 'file',
        path: 'public/static/health-status.json',
        maxAge: 6 * 60 * 1000 // 6分钟内必须更新
      },
      priority: 5,
      restartDelay: 5000
    }
  ],
  
  // PM2配置
  pm2: {
    maxRestarts: 3,
    restartWindow: 10 * 60 * 1000 // 10分钟内
  }
};

// ==================== 状态管理 ====================

let guardianState = {
  startTime: new Date().toISOString(),
  lastCheck: null,
  checkCount: 0,
  processes: {},
  alerts: [],
  statistics: {
    totalRestarts: 0,
    totalFailures: 0,
    totalChecks: 0
  }
};

// 初始化进程状态
CONFIG.processes.forEach(proc => {
  guardianState.processes[proc.name] = {
    status: 'unknown',
    lastCheck: null,
    restartCount: 0,
    lastRestart: null,
    lastError: null,
    uptime: null,
    pid: null,
    healthStatus: 'unknown'
  };
});

// ==================== 工具函数 ====================

/**
 * 获取北京时间
 */
function getBeijingTime(date = new Date()) {
  return new Date(date.getTime() + (8 * 60 * 60 * 1000));
}

/**
 * 格式化时间
 */
function formatTime(date = new Date()) {
  const beijingTime = getBeijingTime(date);
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  const hour = String(beijingTime.getUTCHours()).padStart(2, '0');
  const minute = String(beijingTime.getUTCMinutes()).padStart(2, '0');
  const second = String(beijingTime.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 记录日志
 */
async function log(message, level = 'INFO') {
  const timestamp = formatTime();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logMessage.trim());
  
  try {
    await fs.appendFile(CONFIG.logFile, logMessage);
  } catch (error) {
    console.error('写入日志失败:', error.message);
  }
}

/**
 * 添加告警
 */
function addAlert(message, level = 'warning') {
  const alert = {
    time: formatTime(),
    level,
    message
  };
  
  guardianState.alerts.unshift(alert);
  
  // 只保留最近50条告警
  if (guardianState.alerts.length > 50) {
    guardianState.alerts = guardianState.alerts.slice(0, 50);
  }
}

// ==================== PM2进程检查 ====================

/**
 * 检查PM2进程状态
 */
async function checkPM2Process(processName) {
  try {
    const { stdout } = await execAsync(`pm2 jlist`);
    const processes = JSON.parse(stdout);
    
    const process = processes.find(p => p.name === processName);
    
    if (!process) {
      return {
        exists: false,
        status: 'not_found',
        message: '进程不存在'
      };
    }
    
    const status = process.pm2_env.status;
    const pid = process.pid;
    const uptime = process.pm2_env.pm_uptime;
    const restarts = process.pm2_env.restart_time;
    
    return {
      exists: true,
      status: status === 'online' ? 'running' : 'stopped',
      pid,
      uptime,
      restarts,
      memory: process.monit.memory,
      cpu: process.monit.cpu,
      message: status === 'online' ? '进程运行中' : `进程状态: ${status}`
    };
  } catch (error) {
    return {
      exists: false,
      status: 'error',
      message: `检查失败: ${error.message}`
    };
  }
}

/**
 * 启动PM2进程
 */
async function startPM2Process(processConfig) {
  try {
    await log(`尝试启动进程: ${processConfig.name}`, 'INFO');
    
    const { stdout, stderr } = await execAsync(
      `cd /home/user/webapp && pm2 start "${processConfig.command}" --name "${processConfig.name}"`
    );
    
    await log(`进程启动成功: ${processConfig.name}`, 'INFO');
    addAlert(`进程 ${processConfig.name} 启动成功`, 'success');
    
    return { success: true };
  } catch (error) {
    await log(`进程启动失败: ${processConfig.name} - ${error.message}`, 'ERROR');
    addAlert(`进程 ${processConfig.name} 启动失败: ${error.message}`, 'error');
    
    return { success: false, error: error.message };
  }
}

/**
 * 重启PM2进程
 */
async function restartPM2Process(processConfig) {
  try {
    await log(`尝试重启进程: ${processConfig.name}`, 'WARN');
    
    const { stdout, stderr } = await execAsync(
      `pm2 restart ${processConfig.name}`
    );
    
    await log(`进程重启成功: ${processConfig.name}`, 'INFO');
    addAlert(`进程 ${processConfig.name} 已重启`, 'warning');
    
    guardianState.statistics.totalRestarts++;
    
    return { success: true };
  } catch (error) {
    await log(`进程重启失败: ${processConfig.name} - ${error.message}`, 'ERROR');
    addAlert(`进程 ${processConfig.name} 重启失败: ${error.message}`, 'error');
    
    return { success: false, error: error.message };
  }
}

// ==================== 健康检查 ====================

/**
 * 执行API健康检查
 */
async function checkApiHealth(healthCheck) {
  try {
    const response = await fetch(healthCheck.url, {
      timeout: healthCheck.timeout || 10000
    });
    
    if (!response.ok) {
      return {
        healthy: false,
        message: `HTTP ${response.status}`
      };
    }
    
    const data = await response.json();
    
    // 检查必需字段
    if (healthCheck.expectedFields) {
      const missingFields = healthCheck.expectedFields.filter(
        field => !data.hasOwnProperty(field)
      );
      
      if (missingFields.length > 0) {
        return {
          healthy: false,
          message: `缺少字段: ${missingFields.join(', ')}`
        };
      }
    }
    
    return {
      healthy: true,
      message: 'API响应正常'
    };
  } catch (error) {
    return {
      healthy: false,
      message: `API检查失败: ${error.message}`
    };
  }
}

/**
 * 执行文件健康检查
 */
async function checkFileHealth(healthCheck) {
  try {
    const filePath = path.join(__dirname, healthCheck.path);
    const stats = await fs.stat(filePath);
    
    const fileAge = Date.now() - stats.mtime.getTime();
    
    if (fileAge > healthCheck.maxAge) {
      return {
        healthy: false,
        message: `文件过期 (${Math.round(fileAge / 1000)}秒前更新)`
      };
    }
    
    return {
      healthy: true,
      message: `文件新鲜 (${Math.round(fileAge / 1000)}秒前更新)`
    };
  } catch (error) {
    return {
      healthy: false,
      message: `文件检查失败: ${error.message}`
    };
  }
}

/**
 * 执行进程健康检查
 */
async function performHealthCheck(processConfig) {
  if (!processConfig.healthCheck) {
    return { healthy: true, message: '无需健康检查' };
  }
  
  const healthCheck = processConfig.healthCheck;
  
  if (healthCheck.type === 'api') {
    return await checkApiHealth(healthCheck);
  } else if (healthCheck.type === 'file') {
    return await checkFileHealth(healthCheck);
  }
  
  return { healthy: true, message: '未知检查类型' };
}

// ==================== 主监控逻辑 ====================

/**
 * 检查单个进程
 */
async function checkProcess(processConfig) {
  const state = guardianState.processes[processConfig.name];
  state.lastCheck = formatTime();
  
  // 1. 检查进程是否存在
  const processCheck = await checkPM2Process(processConfig.name);
  
  state.status = processCheck.status;
  state.pid = processCheck.pid;
  state.uptime = processCheck.uptime;
  
  // 2. 如果进程不存在或停止，尝试启动
  if (!processCheck.exists || processCheck.status === 'stopped') {
    await log(`进程 ${processConfig.name} 不在运行中，尝试启动...`, 'WARN');
    
    const startResult = await startPM2Process(processConfig);
    
    if (startResult.success) {
      state.status = 'running';
      state.restartCount++;
      state.lastRestart = formatTime();
      guardianState.statistics.totalRestarts++;
    } else {
      state.status = 'failed';
      state.lastError = startResult.error;
      guardianState.statistics.totalFailures++;
      addAlert(`进程 ${processConfig.name} 启动失败`, 'error');
    }
    
    return;
  }
  
  // 3. 进程存在且运行中，执行健康检查
  if (processCheck.status === 'running') {
    const healthResult = await performHealthCheck(processConfig);
    
    state.healthStatus = healthResult.healthy ? 'healthy' : 'unhealthy';
    
    if (!healthResult.healthy) {
      await log(
        `进程 ${processConfig.name} 健康检查失败: ${healthResult.message}`,
        'WARN'
      );
      
      addAlert(
        `进程 ${processConfig.name} 健康异常: ${healthResult.message}`,
        'warning'
      );
      
      // 健康检查失败，尝试重启
      await log(`尝试重启不健康的进程: ${processConfig.name}`, 'WARN');
      
      const restartResult = await restartPM2Process(processConfig);
      
      if (restartResult.success) {
        state.restartCount++;
        state.lastRestart = formatTime();
      } else {
        state.lastError = restartResult.error;
        guardianState.statistics.totalFailures++;
      }
    }
  }
}

/**
 * 执行完整检查
 */
async function performFullCheck() {
  guardianState.lastCheck = formatTime();
  guardianState.checkCount++;
  guardianState.statistics.totalChecks++;
  
  await log('========================================', 'INFO');
  await log(`开始第 ${guardianState.checkCount} 次进程健康检查`, 'INFO');
  await log('========================================', 'INFO');
  
  // 按优先级排序检查
  const sortedProcesses = [...CONFIG.processes].sort(
    (a, b) => a.priority - b.priority
  );
  
  for (const processConfig of sortedProcesses) {
    await checkProcess(processConfig);
    
    // 检查之间短暂延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await log('所有进程检查完成', 'INFO');
  
  // 保存状态
  await saveStatus();
}

/**
 * 保存状态到文件
 */
async function saveStatus() {
  try {
    const statusData = {
      lastUpdate: new Date().toISOString(),
      lastUpdateDisplay: formatTime(),
      guardianUptime: Date.now() - new Date(guardianState.startTime).getTime(),
      ...guardianState,
      config: {
        checkInterval: CONFIG.checkInterval / 1000 / 60 + ' 分钟',
        webPort: CONFIG.webPort,
        processCount: CONFIG.processes.length
      }
    };
    
    // 确保目录存在
    const dir = path.dirname(CONFIG.statusFile);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(
      CONFIG.statusFile,
      JSON.stringify(statusData, null, 2),
      'utf8'
    );
  } catch (error) {
    await log(`保存状态文件失败: ${error.message}`, 'ERROR');
  }
}

// ==================== Web控制台 ====================

/**
 * 生成HTML控制台
 */
function generateDashboardHTML() {
  const processRows = CONFIG.processes.map(proc => {
    const state = guardianState.processes[proc.name];
    const statusColor = 
      state.status === 'running' ? 'green' :
      state.status === 'stopped' ? 'orange' : 'red';
    
    const healthColor = 
      state.healthStatus === 'healthy' ? 'green' :
      state.healthStatus === 'unhealthy' ? 'orange' : 'gray';
    
    return `
      <tr>
        <td><strong>${proc.name}</strong></td>
        <td style="font-size: 12px; color: #666;">${proc.description}</td>
        <td><span style="color: ${statusColor}; font-weight: bold;">● ${state.status}</span></td>
        <td><span style="color: ${healthColor};">● ${state.healthStatus}</span></td>
        <td>${state.restartCount}</td>
        <td>${state.lastRestart || '-'}</td>
        <td>${state.lastCheck || '-'}</td>
      </tr>
    `;
  }).join('');
  
  const alertRows = guardianState.alerts.slice(0, 20).map(alert => {
    const levelColor = 
      alert.level === 'error' ? 'red' :
      alert.level === 'warning' ? 'orange' : 'green';
    
    return `
      <tr>
        <td>${alert.time}</td>
        <td><span style="color: ${levelColor}; font-weight: bold;">${alert.level.toUpperCase()}</span></td>
        <td>${alert.message}</td>
      </tr>
    `;
  }).join('');
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🛡️ 进程守护者 - 控制台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card h3 { font-size: 14px; color: #666; margin-bottom: 10px; }
    .stat-card .value { font-size: 28px; font-weight: bold; color: #333; }
    .section {
      background: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 {
      font-size: 20px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      color: #666;
      border-bottom: 2px solid #dee2e6;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    tr:hover { background: #f8f9fa; }
    .refresh-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
    }
    .refresh-btn:hover { background: #5568d3; transform: translateY(-1px); }
    .auto-refresh {
      display: inline-block;
      margin-left: 15px;
      font-size: 13px;
      color: #666;
    }
  </style>
  <script>
    let autoRefreshInterval = null;
    
    function refreshPage() {
      window.location.reload();
    }
    
    function toggleAutoRefresh() {
      const checkbox = document.getElementById('autoRefresh');
      if (checkbox.checked) {
        autoRefreshInterval = setInterval(refreshPage, 30000); // 每30秒刷新
      } else {
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
          autoRefreshInterval = null;
        }
      }
    }
    
    // 页面加载时自动开启自动刷新
    window.onload = function() {
      const checkbox = document.getElementById('autoRefresh');
      checkbox.checked = true;
      toggleAutoRefresh();
    };
  </script>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ 进程守护者 (Process Guardian)</h1>
      <p>自动监控和管理关键后台进程，确保系统稳定运行</p>
      <p style="margin-top: 10px;">
        <button class="refresh-btn" onclick="refreshPage()">🔄 立即刷新</button>
        <label class="auto-refresh">
          <input type="checkbox" id="autoRefresh" onchange="toggleAutoRefresh()">
          自动刷新 (30秒)
        </label>
      </p>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <h3>运行时长</h3>
        <div class="value">${Math.round((Date.now() - new Date(guardianState.startTime).getTime()) / 1000 / 60)}分钟</div>
      </div>
      <div class="stat-card">
        <h3>检查次数</h3>
        <div class="value">${guardianState.statistics.totalChecks}</div>
      </div>
      <div class="stat-card">
        <h3>重启次数</h3>
        <div class="value">${guardianState.statistics.totalRestarts}</div>
      </div>
      <div class="stat-card">
        <h3>失败次数</h3>
        <div class="value">${guardianState.statistics.totalFailures}</div>
      </div>
      <div class="stat-card">
        <h3>最后检查</h3>
        <div class="value" style="font-size: 16px;">${guardianState.lastCheck || '未开始'}</div>
      </div>
    </div>
    
    <div class="section">
      <h2>📊 进程状态监控</h2>
      <table>
        <thead>
          <tr>
            <th>进程名称</th>
            <th>功能描述</th>
            <th>运行状态</th>
            <th>健康状态</th>
            <th>重启次数</th>
            <th>最后重启</th>
            <th>最后检查</th>
          </tr>
        </thead>
        <tbody>
          ${processRows}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h2>🚨 最近告警 (最多显示20条)</h2>
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>级别</th>
            <th>消息</th>
          </tr>
        </thead>
        <tbody>
          ${alertRows || '<tr><td colspan="3" style="text-align: center; color: #999;">暂无告警</td></tr>'}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h2>ℹ️ 监控配置</h2>
      <p><strong>检查间隔:</strong> ${CONFIG.checkInterval / 1000 / 60} 分钟</p>
      <p><strong>监控进程数:</strong> ${CONFIG.processes.length}</p>
      <p><strong>守护者启动时间:</strong> ${formatTime(new Date(guardianState.startTime))}</p>
      <p><strong>Web控制台端口:</strong> ${CONFIG.webPort}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 创建HTTP服务器
 */
function createWebServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(generateDashboardHTML());
    } else if (req.url === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(guardianState, null, 2));
    } else if (req.url === '/api/restart-all') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      // 异步重启所有进程
      (async () => {
        for (const proc of CONFIG.processes) {
          await restartPM2Process(proc);
        }
      })();
      
      res.end(JSON.stringify({ success: true, message: '所有进程重启指令已发送' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
  
  server.listen(CONFIG.webPort, () => {
    log(`Web控制台启动成功: http://localhost:${CONFIG.webPort}`, 'INFO');
  });
}

// ==================== 启动守护者 ====================

async function startGuardian() {
  await log('========================================', 'INFO');
  await log('🛡️ 进程守护者启动', 'INFO');
  await log(`检查间隔: ${CONFIG.checkInterval / 1000 / 60} 分钟`, 'INFO');
  await log(`监控进程数: ${CONFIG.processes.length}`, 'INFO');
  await log(`Web控制台: http://localhost:${CONFIG.webPort}`, 'INFO');
  await log('========================================', 'INFO');
  
  // 启动Web服务器
  createWebServer();
  
  // 立即执行第一次检查
  await performFullCheck();
  
  // 设置定时检查
  setInterval(async () => {
    await performFullCheck();
  }, CONFIG.checkInterval);
  
  await log('守护者运行中...', 'INFO');
}

// ==================== 优雅退出 ====================

process.on('SIGINT', async () => {
  await log('收到退出信号，正在关闭守护者...', 'INFO');
  await log(`总计检查: ${guardianState.statistics.totalChecks} 次`, 'INFO');
  await log(`总计重启: ${guardianState.statistics.totalRestarts} 次`, 'INFO');
  await log('守护者已停止', 'INFO');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await log('收到终止信号，正在关闭守护者...', 'INFO');
  await log(`总计检查: ${guardianState.statistics.totalChecks} 次`, 'INFO');
  await log(`总计重启: ${guardianState.statistics.totalRestarts} 次`, 'INFO');
  await log('守护者已停止', 'INFO');
  process.exit(0);
});

// 启动守护者
startGuardian().catch(async (error) => {
  await log(`守护者启动失败: ${error.message}`, 'ERROR');
  process.exit(1);
});
