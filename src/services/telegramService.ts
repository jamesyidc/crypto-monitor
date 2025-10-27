// Telegram 通知服务
export class TelegramService {
  private botToken: string;
  private chatId: string;
  private apiUrl: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  // 发送预警消息到 Telegram
  async sendAlert(alert: any, klineData: any): Promise<boolean> {
    try {
      // 构建消息内容
      const message = this.buildAlertMessage(alert, klineData);
      
      // 发送到 Telegram
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        console.error('❌ Telegram发送失败:', JSON.stringify(result));
        console.error('   消息内容预览:', message.substring(0, 200));
        return false;
      }

      console.log(`✅ 预警已发送到Telegram: ${alert.symbol} ${alert.time}`);
      return true;
    } catch (error) {
      console.error('❌ Telegram发送异常:', error);
      return false;
    }
  }

  // 构建预警消息
  private buildAlertMessage(alert: any, klineData: any): string {
    // 计算波动百分比
    const volatility = klineData.high && klineData.low && klineData.low > 0
      ? (((klineData.high - klineData.low) / klineData.low) * 100).toFixed(2)
      : '0.00';

    // 计算SAR差值
    const sarDiff = klineData.sar && klineData.close
      ? (klineData.close - klineData.sar).toFixed(2)
      : '0.00';

    // 判断新高新低
    const isNewHigh = klineData.rsi_5min && klineData.rsi_5min > 80 ? '✅' : '❌';
    const isNewLow = klineData.rsi_5min && klineData.rsi_5min < 20 ? '✅' : '❌';

    // 状态（基于触发条件）
    const status = alert.triggers.join(' + ');

    // 构建消息
    const message = `⚡️<b>交易预警</b>⚡️

📌 <b>币种:</b> ${alert.symbol || klineData.symbol}
🕒 <b>时间:</b> ${alert.time || klineData.time}
📊 <b>信号:</b> ${klineData.signal || '-'}
💹 <b>开盘:</b> ${klineData.open?.toFixed(4) || '-'}
📈 <b>最高:</b> ${klineData.high?.toFixed(4) || '-'}
📉 <b>最低:</b> ${klineData.low?.toFixed(4) || '-'}
🔔 <b>收盘:</b> ${klineData.close?.toFixed(4) || '-'}
📦 <b>成交量:</b> ${alert.data.volume || klineData.volume}
📐 <b>波动:</b> ${volatility}%
📉 <b>涨跌幅:</b> ${alert.data.changePercent || klineData.change}
📍 <b>SAR:</b> ${klineData.sar?.toFixed(4) || '-'} (差值:${sarDiff})
📊 <b>RSI(5m):</b> ${alert.data.rsi5min || klineData.rsi_5min || '-'}
📊 <b>RSI(1h):</b> ${klineData.rsi_1h || '-'}
📌 <b>状态:</b> ${status}
🚨 <b>新高:</b> ${isNewHigh}
🚨 <b>新低:</b> ${isNewLow}

🔔 <b>触发条件:</b>
${alert.triggers.map((t: string) => `• ${t}`).join('\n')}

💡 <b>量能级别:</b> ${alert.data.volumeLevel}
⚡️ <b>SAR变化:</b> ${alert.data.sarChangePercent}`;

    return message;
  }

  // 批量发送多个预警
  async sendMultipleAlerts(alerts: any[], klineDataMap: Map<number, any>): Promise<number> {
    let successCount = 0;

    console.log(`📨 准备发送 ${alerts.length} 条预警到Telegram...`);
    
    for (let i = 0; i < alerts.length; i++) {
      const alert = alerts[i];
      const klineData = klineDataMap.get(alert.index);
      if (klineData) {
        console.log(`   [${i+1}/${alerts.length}] ${alert.symbol} ${alert.time} (index=${alert.index})`);
        const success = await this.sendAlert(alert, klineData);
        if (success) {
          successCount++;
        }
        
        // 避免发送过快，每条消息间隔1秒
        await this.delay(1000);
      } else {
        console.log(`   [${i+1}/${alerts.length}] ⚠️  跳过：找不到K线数据 (index=${alert.index})`);
      }
    }

    console.log(`📨 发送完成：成功 ${successCount}/${alerts.length} 条`);
    return successCount;
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      const result = await response.json();
      
      if (result.ok) {
        console.log('✅ Telegram连接成功:', result.result.username);
        return true;
      } else {
        console.error('❌ Telegram连接失败:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Telegram连接异常:', error);
      return false;
    }
  }
}
