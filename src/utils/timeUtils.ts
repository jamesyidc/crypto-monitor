/**
 * 北京时间工具类
 * 所有时间计算和判断统一使用北京时间（UTC+8）
 */

// 北京时区偏移（毫秒）
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8

/**
 * 获取当前北京时间的Date对象
 */
export function getBeijingTime(): Date {
  const now = new Date();
  // 获取UTC时间戳，然后加上8小时偏移
  const utcTime = now.getTime();
  return new Date(utcTime + BEIJING_OFFSET_MS);
}

/**
 * 获取北京时间的日期字符串（格式：YYYY-MM-DD）
 */
export function getBeijingDateString(date?: Date): string {
  const beijingTime = date || getBeijingTime();
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取北京时间今天0点的时间戳（ISO字符串）
 * @returns ISO格式的时间字符串，表示北京时间今天00:00:00
 */
export function getBeijingTodayStart(): string {
  const beijingTime = getBeijingTime();
  // 设置为0点
  beijingTime.setUTCHours(0, 0, 0, 0);
  // 转换回UTC时间（减去8小时）
  const utcMidnight = new Date(beijingTime.getTime() - BEIJING_OFFSET_MS);
  return utcMidnight.toISOString();
}

/**
 * 获取北京时间昨天的日期字符串（格式：YYYY-MM-DD）
 */
export function getBeijingYesterday(): string {
  const beijingTime = getBeijingTime();
  beijingTime.setUTCDate(beijingTime.getUTCDate() - 1);
  return getBeijingDateString(beijingTime);
}

/**
 * 获取北京时间的完整时间字符串（格式：YYYY-MM-DD HH:mm:ss）
 */
export function getBeijingDateTimeString(date?: Date): string {
  const beijingTime = date || getBeijingTime();
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
  const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取北京时间的ISO字符串（用于存储到数据库的round_time）
 */
export function getBeijingISOString(): string {
  // 直接返回UTC时间的ISO字符串，但在查询时会按北京时间解析
  return new Date().toISOString();
}

/**
 * 将UTC时间字符串转换为北京时间的日期字符串
 * @param utcString UTC时间字符串（支持ISO格式或SQLite datetime格式）
 * @returns 北京时间的日期字符串（YYYY-MM-DD）
 */
export function convertUTCtoBeijingDateString(utcString: string): string {
  // 处理SQLite datetime格式：'2025-10-27 16:36:24'
  // 将空格替换为'T'，并添加'Z'后缀，转换为ISO格式
  const isoString = utcString.includes('T') 
    ? utcString 
    : utcString.replace(' ', 'T') + 'Z';
  
  const utcDate = new Date(isoString);
  const beijingTime = new Date(utcDate.getTime() + BEIJING_OFFSET_MS);
  return getBeijingDateString(beijingTime);
}

/**
 * 检查两个时间是否是北京时间的同一天
 * @param date1 第一个时间（ISO字符串或Date对象）
 * @param date2 第二个时间（ISO字符串或Date对象），默认为当前时间
 */
export function isSameBeijingDay(date1: string | Date, date2?: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = date2 ? (typeof date2 === 'string' ? new Date(date2) : date2) : new Date();
  
  const beijing1 = new Date(d1.getTime() + BEIJING_OFFSET_MS);
  const beijing2 = new Date(d2.getTime() + BEIJING_OFFSET_MS);
  
  return beijing1.getUTCFullYear() === beijing2.getUTCFullYear() &&
         beijing1.getUTCMonth() === beijing2.getUTCMonth() &&
         beijing1.getUTCDate() === beijing2.getUTCDate();
}

/**
 * 获取N天前的北京时间日期字符串
 * @param days 天数
 * @returns YYYY-MM-DD格式的日期字符串
 */
export function getBeijingDateDaysAgo(days: number): string {
  const beijingTime = getBeijingTime();
  beijingTime.setUTCDate(beijingTime.getUTCDate() - days);
  return getBeijingDateString(beijingTime);
}

/**
 * 调试：打印当前时间信息
 */
export function debugTimeInfo() {
  const now = new Date();
  const beijingTime = getBeijingTime();
  console.log(`
╔════════════════════════════════════════╗
║         时间调试信息                    ║
╠════════════════════════════════════════╣
  UTC时间:    ${now.toISOString()}
  UTC日期:    ${now.toISOString().split('T')[0]}
  ────────────────────────────────────
  北京时间:   ${getBeijingDateTimeString()}
  北京日期:   ${getBeijingDateString()}
  今天0点:    ${getBeijingTodayStart()}
  昨天日期:   ${getBeijingYesterday()}
╚════════════════════════════════════════╝
  `);
}
