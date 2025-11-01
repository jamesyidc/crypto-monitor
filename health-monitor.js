#!/usr/bin/env node

/**
 * 系统健康监控脚本
 * 每4分钟检查一次系统状态
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  checkInterval: 4 * 60 * 1000, // 4分钟
  port: 3000,
  appUrl: 'http://localhost:3000',
  dbPath: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite',
  logFile: 'health-monitor.log',
  statusFile: 'public/static/health-status.json',
  maxRecords: 10,
  restartCommand: 'npm run dev:sandbox'
};

// 监控记录
let healthRecords = [];

/**
 * 获取北京时间（UTC+8）
 */
function getBeijingTime(date = new Date()) {
  return new Date(date.getTime() + (8 * 60 * 60 * 1000));
}

/**
 * 格式化时间为北京时间字符串
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
 * 检查端口是否被占用
 */
async function checkPort() {
  try {
    const { stdout } = await execAsync(`lsof -i:${CONFIG.port} -t || echo ""`);
    const pid = stdout.trim();
    
    if (pid) {
      return {
        status: 'ok',
        pid: pid,
        message: `端口 ${CONFIG.port} 正在被 PID ${pid} 使用`
      };
    } else {
      return {
        status: 'error',
        message: `端口 ${CONFIG.port} 未被占用`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: `检查端口失败: ${error.message}`
    };
  }
}

/**
 * 检查数据库状态
 */
async function checkDatabase() {
  try {
    // 检查数据库文件是否存在
    await fs.access(CONFIG.dbPath);
    
    // 获取文件信息
    const stats = await fs.stat(CONFIG.dbPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    // 检查文件是否可读写
    await fs.access(CONFIG.dbPath, fs.constants.R_OK | fs.constants.W_OK);
    
    return {
      status: 'ok',
      size: fileSizeMB + ' MB',
      lastModified: formatTime(stats.mtime),
      message: `数据库正常 (${fileSizeMB} MB)`
    };
  } catch (error) {
    return {
      status: 'error',
      message: `数据库检查失败: ${error.message}`
    };
  }
}

/**
 * 检查应用HTTP响应
 */
async function checkHttpResponse() {
  try {
    const { stdout, stderr } = await execAsync(
      `curl -s -o /dev/null -w "%{http_code},%{time_total}" --max-time 10 ${CONFIG.appUrl}`
    );
    
    const [statusCode, responseTime] = stdout.trim().split(',');
    const responseTimeMs = (parseFloat(responseTime) * 1000).toFixed(0);
    
    if (statusCode === '200') {
      return {
        status: 'ok',
        statusCode: statusCode,
        responseTime: responseTimeMs + ' ms',
        message: `HTTP响应正常 (${responseTimeMs} ms)`
      };
    } else {
      return {
        status: 'warning',
        statusCode: statusCode,
        responseTime: responseTimeMs + ' ms',
        message: `HTTP状态码: ${statusCode}`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: `HTTP请求失败: ${error.message}`
    };
  }
}

/**
 * 检查API端点
 */
async function checkApiEndpoint() {
  try {
    const { stdout } = await execAsync(
      `curl -s --max-time 15 ${CONFIG.appUrl}/api/signal/all | head -c 100`
    );
    
    if (stdout && stdout.length > 0) {
      return {
        status: 'ok',
        message: 'API端点响应正常'
      };
    } else {
      return {
        status: 'warning',
        message: 'API端点返回空响应'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: `API端点检查失败: ${error.message}`
    };
  }
}

/**
 * 检查系统资源
 */
async function checkSystemResources() {
  try {
    // 检查内存使用
    const { stdout: memInfo } = await execAsync(`free -m | grep Mem`);
    const memParts = memInfo.trim().split(/\s+/);
    const totalMem = parseInt(memParts[1]);
    const usedMem = parseInt(memParts[2]);
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
    
    // 检查磁盘使用
    const { stdout: diskInfo } = await execAsync(`df -h /home/user/webapp | tail -1`);
    const diskParts = diskInfo.trim().split(/\s+/);
    const diskUsage = diskParts[4];
    
    return {
      status: 'ok',
      memory: `${memUsagePercent}%`,
      disk: diskUsage,
      message: `系统资源正常 (内存: ${memUsagePercent}%, 磁盘: ${diskUsage})`
    };
  } catch (error) {
    return {
      status: 'warning',
      message: `系统资源检查失败: ${error.message}`
    };
  }
}

/**
 * 检查进程状态
 */
async function checkProcessStatus() {
  try {
    const { stdout } = await execAsync(`ps aux | grep -E "node|wrangler|workerd" | grep -v grep | wc -l`);
    const processCount = parseInt(stdout.trim());
    
    if (processCount > 0) {
      return {
        status: 'ok',
        count: processCount,
        message: `发现 ${processCount} 个相关进程`
      };
    } else {
      return {
        status: 'error',
        count: 0,
        message: '未发现应用进程'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: `进程检查失败: ${error.message}`
    };
  }
}

/**
 * 执行完整健康检查
 */
async function performHealthCheck() {
  await log('开始健康检查...', 'INFO');
  
  const checkTime = new Date();
  const checks = {
    timestamp: checkTime.toISOString(),
    timestampDisplay: formatTime(checkTime),
    port: await checkPort(),
    database: await checkDatabase(),
    http: await checkHttpResponse(),
    api: await checkApiEndpoint(),
    system: await checkSystemResources(),
    process: await checkProcessStatus()
  };
  
  // 计算总体状态
  const hasError = Object.values(checks).some(check => 
    check && typeof check === 'object' && check.status === 'error'
  );
  const hasWarning = Object.values(checks).some(check => 
    check && typeof check === 'object' && check.status === 'warning'
  );
  
  checks.overall = hasError ? 'error' : (hasWarning ? 'warning' : 'ok');
  checks.overallMessage = hasError ? '系统异常' : (hasWarning ? '系统警告' : '系统正常');
  
  // 记录到日志
  await log(`检查完成 - 状态: ${checks.overallMessage}`, checks.overall.toUpperCase());
  if (hasError || hasWarning) {
    Object.entries(checks).forEach(([key, value]) => {
      if (value && typeof value === 'object' && (value.status === 'error' || value.status === 'warning')) {
        log(`  [${key}] ${value.message}`, value.status.toUpperCase());
      }
    });
  }
  
  // 添加到记录
  healthRecords.unshift(checks);
  if (healthRecords.length > CONFIG.maxRecords) {
    healthRecords = healthRecords.slice(0, CONFIG.maxRecords);
  }
  
  // 保存状态文件
  await saveHealthStatus();
  
  // 如果有严重错误，尝试自动修复
  if (hasError) {
    await handleErrors(checks);
  }
  
  return checks;
}

/**
 * 保存健康状态到文件
 */
async function saveHealthStatus() {
  try {
    const beijingTime = getBeijingTime(new Date());
    const statusData = {
      lastUpdate: beijingTime.toISOString(), // 使用北京时间
      lastUpdateDisplay: formatTime(new Date()), // 添加显示格式
      records: healthRecords,
      config: {
        checkInterval: CONFIG.checkInterval / 1000 / 60 + ' 分钟',
        port: CONFIG.port,
        maxRecords: CONFIG.maxRecords
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

/**
 * 处理错误并尝试修复
 */
async function handleErrors(checks) {
  await log('检测到系统异常，尝试自动修复...', 'WARN');
  
  // 如果端口未被占用，尝试重启服务
  if (checks.port.status === 'error') {
    await log('端口未被占用，尝试重启服务...', 'WARN');
    await restartService();
  }
  
  // 如果进程不存在，尝试重启服务
  if (checks.process.status === 'error') {
    await log('应用进程不存在，尝试重启服务...', 'WARN');
    await restartService();
  }
  
  // 如果数据库有问题，记录详细错误
  if (checks.database.status === 'error') {
    await log('数据库异常，需要人工介入！', 'ERROR');
  }
}

/**
 * 重启服务
 */
async function restartService() {
  try {
    await log('正在重启服务...', 'INFO');
    
    // 先清理端口
    await execAsync(`fuser -k ${CONFIG.port}/tcp 2>/dev/null || true`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 启动新服务（后台运行）
    exec(`cd /home/user/webapp && ${CONFIG.restartCommand} > /dev/null 2>&1 &`);
    
    await log('服务重启命令已执行', 'INFO');
    
    // 等待服务启动
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 验证服务是否启动成功
    const portCheck = await checkPort();
    if (portCheck.status === 'ok') {
      await log('服务重启成功！', 'INFO');
      return true;
    } else {
      await log('服务重启失败，端口仍未监听', 'ERROR');
      return false;
    }
  } catch (error) {
    await log(`重启服务失败: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * 启动监控
 */
async function startMonitoring() {
  await log('========================================', 'INFO');
  await log('健康监控系统启动', 'INFO');
  await log(`检查间隔: ${CONFIG.checkInterval / 1000 / 60} 分钟`, 'INFO');
  await log(`监控端口: ${CONFIG.port}`, 'INFO');
  await log(`应用URL: ${CONFIG.appUrl}`, 'INFO');
  await log('========================================', 'INFO');
  
  // 立即执行第一次检查
  await performHealthCheck();
  
  // 设置定时检查
  setInterval(async () => {
    await performHealthCheck();
  }, CONFIG.checkInterval);
  
  await log('监控系统运行中...', 'INFO');
}

/**
 * 优雅退出
 */
process.on('SIGINT', async () => {
  await log('收到退出信号，正在关闭监控系统...', 'INFO');
  await log('监控系统已停止', 'INFO');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await log('收到终止信号，正在关闭监控系统...', 'INFO');
  await log('监控系统已停止', 'INFO');
  process.exit(0);
});

// 启动监控
startMonitoring().catch(async (error) => {
  await log(`监控系统启动失败: ${error.message}`, 'ERROR');
  process.exit(1);
});
