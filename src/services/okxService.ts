/**
 * OKX API 服务
 * 官方文档: https://www.okx.com/docs-v5/zh/
 */

export interface OKXCredentials {
  apiKey: string;
  secretKey: string;
  passphrase: string;
  isTestnet?: boolean;
}

export interface OKXAccountBalance {
  totalEquity: number;        // 总权益（USD）
  availableBalance: number;   // 可用余额
  frozenBalance: number;      // 冻结余额
  unrealizedPnl: number;      // 未实现盈亏
  details: Array<{
    currency: string;
    balance: number;
    available: number;
    frozen: number;
  }>;
}

export interface OKXPosition {
  instId: string;             // 产品ID，如 BTC-USDT-SWAP
  posSide: string;            // 持仓方向 long/short
  pos: string;                // 持仓数量
  avgPx: string;              // 开仓均价
  markPx: string;             // 标记价格
  upl: string;                // 未实现盈亏
  uplRatio: string;           // 未实现盈亏比例
  lever: string;              // 杠杆倍数
  margin: string;             // 保证金
  imr: string;                // 初始保证金
  mmr: string;                // 维持保证金
  mgnRatio: string;           // 保证金率
  liqPx: string;              // 预估强平价
  cTime: string;              // 持仓创建时间
  uTime: string;              // 持仓更新时间
}

export class OKXService {
  private baseUrl: string;
  private credentials: OKXCredentials;

  constructor(credentials: OKXCredentials) {
    this.credentials = credentials;
    this.baseUrl = credentials.isTestnet 
      ? 'https://www.okx.com'  // OKX 没有专门的测试网，使用模拟盘需要特殊配置
      : 'https://www.okx.com';
  }

  /**
   * 生成签名（使用 Web Crypto API）
   */
  private async sign(timestamp: string, method: string, requestPath: string, body: string = ''): Promise<string> {
    const message = timestamp + method + requestPath + body;
    
    // 将密钥和消息转换为 ArrayBuffer
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.credentials.secretKey);
    const messageData = encoder.encode(message);
    
    // 导入密钥
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // 生成签名
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    
    // 转换为 Base64
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    
    return signatureBase64;
  }

  /**
   * 发送 API 请求
   */
  private async request(method: string, endpoint: string, body?: any): Promise<any> {
    const timestamp = new Date().toISOString();
    const requestPath = `/api/v5${endpoint}`;
    const bodyStr = body ? JSON.stringify(body) : '';
    const sign = await this.sign(timestamp, method, requestPath, bodyStr);

    const headers = {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': this.credentials.apiKey,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.credentials.passphrase,
    };

    console.log(`📤 OKX API 请求: ${method} ${requestPath}`);

    const response = await fetch(`${this.baseUrl}${requestPath}`, {
      method,
      headers,
      body: bodyStr || undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OKX API 错误 (${response.status}):`, errorText);
      throw new Error(`OKX API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.code !== '0') {
      console.error(`❌ OKX API 返回错误:`, data);
      throw new Error(`OKX API 错误: ${data.code} - ${data.msg}`);
    }

    return data;
  }

  /**
   * 获取账户余额
   * 文档: https://www.okx.com/docs-v5/zh/#rest-api-account-get-balance
   */
  async getAccountBalance(): Promise<OKXAccountBalance> {
    try {
      console.log('📊 获取账户余额...');
      const data = await this.request('GET', '/account/balance');
      
      if (!data.data || data.data.length === 0) {
        throw new Error('账户数据为空');
      }

      const accountData = data.data[0];
      
      // 解析余额详情
      const details = accountData.details.map((item: any) => ({
        currency: item.ccy,
        balance: parseFloat(item.eq || '0'),
        available: parseFloat(item.availEq || '0'),
        frozen: parseFloat(item.frozenBal || '0'),
      }));

      // 计算总权益（USDT 等值）
      const totalEquity = parseFloat(accountData.totalEq || '0');
      const availableBalance = details.reduce((sum, d) => sum + d.available, 0);
      const frozenBalance = details.reduce((sum, d) => sum + d.frozen, 0);
      const unrealizedPnl = parseFloat(accountData.upl || '0');

      console.log(`✅ 账户余额获取成功: 总权益 ${totalEquity} USDT`);

      return {
        totalEquity,
        availableBalance,
        frozenBalance,
        unrealizedPnl,
        details,
      };
    } catch (error: any) {
      console.error('❌ 获取账户余额失败:', error);
      throw error;
    }
  }

  /**
   * 获取持仓信息
   * 文档: https://www.okx.com/docs-v5/zh/#rest-api-account-get-positions
   */
  async getPositions(instType: string = 'SWAP'): Promise<OKXPosition[]> {
    try {
      console.log('📊 获取持仓信息...');
      const data = await this.request('GET', `/account/positions?instType=${instType}`);
      
      if (!data.data) {
        return [];
      }

      console.log(`✅ 持仓信息获取成功: ${data.data.length} 个持仓`);
      return data.data;
    } catch (error: any) {
      console.error('❌ 获取持仓信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取资金账户余额
   * 文档: https://www.okx.com/docs-v5/zh/#rest-api-funding-get-balance
   */
  async getFundingBalance(): Promise<any> {
    try {
      console.log('📊 获取资金账户余额...');
      const data = await this.request('GET', '/asset/balances');
      
      if (!data.data) {
        return [];
      }

      // 过滤出有余额的币种
      const balances = data.data
        .filter((item: any) => parseFloat(item.bal || '0') > 0)
        .map((item: any) => ({
          currency: item.ccy,
          balance: parseFloat(item.bal || '0'),
          available: parseFloat(item.availBal || '0'),
          frozen: parseFloat(item.frozenBal || '0'),
        }));

      console.log(`✅ 资金账户余额获取成功: ${balances.length} 个币种有余额`);
      return balances;
    } catch (error: any) {
      console.error('❌ 获取资金账户余额失败:', error);
      throw error;
    }
  }

  /**
   * 下单
   * 文档: https://www.okx.com/docs-v5/zh/#rest-api-trade-place-order
   */
  async placeOrder(params: {
    instId: string;      // 产品ID，如 BTC-USDT-SWAP
    tdMode: string;      // 交易模式 cross(全仓) isolated(逐仓)
    side: string;        // 订单方向 buy/sell
    posSide?: string;    // 持仓方向 long/short（双向持仓时必填）
    ordType: string;     // 订单类型 market/limit
    sz: string;          // 委托数量
    px?: string;         // 委托价格（限价单必填）
  }): Promise<any> {
    try {
      console.log('📤 下单:', params);
      const data = await this.request('POST', '/trade/order', params);
      
      if (!data.data || data.data.length === 0) {
        throw new Error('下单失败：返回数据为空');
      }

      const orderResult = data.data[0];
      if (orderResult.sCode !== '0') {
        throw new Error(`下单失败: ${orderResult.sMsg}`);
      }

      console.log(`✅ 下单成功: 订单ID ${orderResult.ordId}`);
      return orderResult;
    } catch (error: any) {
      console.error('❌ 下单失败:', error);
      throw error;
    }
  }

  /**
   * 平仓
   */
  async closePosition(params: {
    instId: string;
    posSide: string;     // long/short
    mgnMode: string;     // cross/isolated
  }): Promise<any> {
    try {
      console.log('📤 平仓:', params);
      const data = await this.request('POST', '/trade/close-position', params);
      
      if (!data.data || data.data.length === 0) {
        throw new Error('平仓失败：返回数据为空');
      }

      const result = data.data[0];
      if (result.sCode !== '0') {
        throw new Error(`平仓失败: ${result.sMsg}`);
      }

      console.log(`✅ 平仓成功: ${params.instId} ${params.posSide}`);
      return result;
    } catch (error: any) {
      console.error('❌ 平仓失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史订单
   * 文档: https://www.okx.com/docs-v5/zh/#rest-api-trade-get-order-history-last-7-days
   */
  async getOrderHistory(instType: string = 'SWAP', limit: number = 100): Promise<any[]> {
    try {
      console.log('📊 获取历史订单...');
      const data = await this.request('GET', `/trade/orders-history-archive?instType=${instType}&limit=${limit}`);
      
      if (!data.data) {
        return [];
      }

      console.log(`✅ 历史订单获取成功: ${data.data.length} 条`);
      return data.data;
    } catch (error: any) {
      console.error('❌ 获取历史订单失败:', error);
      throw error;
    }
  }
}
