export interface GlobalIndexQuote {
  symbol: string;
  name: string;
  category: '台股' | '美股四大' | '亞太指數' | '歐洲指數';
  price: number;
  change: number;
  changePct: number;
  isMarketOpen: boolean; // true: 即時 (REGULAR), false: 盤後 (CLOSED / PRE / POST)
  marketStateText: string; // '即時' | '盤後'
  updateTime?: string;
}

export const initialGlobalIndices: GlobalIndexQuote[] = [
  // 🇹🇼 台股指標
  { symbol: '^TWII', name: '加權指數 (TAIEX)', category: '台股', price: 23415.80, change: 185.20, changePct: 0.80, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^TWOII', name: '櫃買指數 (TPEx)', category: '台股', price: 270.45, change: 1.82, changePct: 0.68, isMarketOpen: false, marketStateText: '盤後' },

  // 🇺🇸 美股四大指數
  { symbol: '^DJI', name: '道瓊工業指數', category: '美股四大', price: 40589.34, change: 127.40, changePct: 0.31, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^IXIC', name: '納斯達克指數', category: '美股四大', price: 17357.88, change: 193.58, changePct: 1.13, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^GSPC', name: '標普500指數', category: '美股四大', price: 5459.10, change: 59.63, changePct: 1.11, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^SOX', name: '費城半導體指數', category: '美股四大', price: 5105.65, change: 96.50, changePct: 1.93, isMarketOpen: false, marketStateText: '盤後' },

  // 🌏 亞太指數
  { symbol: '^N225', name: '日經225 (Nikkei)', category: '亞太指數', price: 37869.51, change: -285.34, changePct: -0.75, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^HSI', name: '香港恆生指數', category: '亞太指數', price: 17021.31, change: 18.23, changePct: 0.11, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '000001.SS', name: '上證綜合指數', category: '亞太指數', price: 2890.90, change: -4.43, changePct: -0.15, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^KS11', name: '韓國綜合指數 (KOSPI)', category: '亞太指數', price: 2710.65, change: -14.99, changePct: -0.55, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^BSESN', name: '印度孟買指數 (Sensex)', category: '亞太指數', price: 81332.72, change: 129.65, changePct: 0.16, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^JKSE', name: '印尼雅加達綜合 (IDX)', category: '亞太指數', price: 7288.17, change: 24.32, changePct: 0.33, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^KLSE', name: '馬來西亞富時 (KLCI)', category: '亞太指數', price: 1622.07, change: 1.40, changePct: 0.09, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^STI', name: '新加坡海峽時報 (STI)', category: '亞太指數', price: 3426.85, change: 5.12, changePct: 0.15, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^PSI', name: '菲律賓綜合指數 (PSEi)', category: '亞太指數', price: 6752.50, change: 31.80, changePct: 0.47, isMarketOpen: false, marketStateText: '盤後' },

  // 🇪🇺 歐洲指數
  { symbol: '^GDAXI', name: '德國 DAX 指數', category: '歐洲指數', price: 18417.55, change: 119.50, changePct: 0.65, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^FTSE', name: '英國富時100指數', category: '歐洲指數', price: 8285.71, change: 44.86, changePct: 0.54, isMarketOpen: false, marketStateText: '盤後' },
  { symbol: '^FCHI', name: '法國 CAC 40 指數', category: '歐洲指數', price: 7517.68, change: 90.00, changePct: 1.21, isMarketOpen: false, marketStateText: '盤後' }
];

/**
 * Check US market trading hours (Mon-Fri 09:30 - 16:00 ET)
 */
const isUSMarketOpen = (): boolean => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    let weekday = '';
    let hour = 0;
    let minute = 0;

    for (const part of parts) {
      if (part.type === 'weekday') weekday = part.value;
      if (part.type === 'hour') hour = parseInt(part.value, 10);
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    }

    if (weekday === 'Sat' || weekday === 'Sun') return false;
    const mins = hour * 60 + minute;
    return mins >= 570 && mins < 960; // 09:30 (570) to 16:00 (960)
  } catch (e) {
    return false;
  }
};

/**
 * Check Taiwan market trading hours (Mon-Fri 09:00 - 13:30 TST)
 */
const isTaiwanMarketOpen = (): boolean => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Taipei',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    let weekday = '';
    let hour = 0;
    let minute = 0;

    for (const part of parts) {
      if (part.type === 'weekday') weekday = part.value;
      if (part.type === 'hour') hour = parseInt(part.value, 10);
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    }

    if (weekday === 'Sat' || weekday === 'Sun') return false;
    const mins = hour * 60 + minute;
    return mins >= 540 && mins <= 810; // 09:00 (540) to 13:30 (810)
  } catch (e) {
    return false;
  }
};

/**
 * Robust check if index market is open
 */
const checkIsMarketOpen = (meta: any, category: string): boolean => {
  // 1. Explicit marketState from Yahoo API
  const marketState = (meta?.marketState || '').toUpperCase();
  if (marketState === 'REGULAR' || marketState === 'REGULAR_MARKET') return true;

  // 2. Explicit currentTradingPeriod from Yahoo API
  const regPeriod = meta?.currentTradingPeriod?.regular;
  if (regPeriod?.start && regPeriod?.end) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec >= regPeriod.start && nowSec <= regPeriod.end) {
      return true;
    }
  }

  // 3. Fallback based on category timezone calculation
  if (category === '美股四大') {
    return isUSMarketOpen();
  }
  if (category === '台股') {
    return isTaiwanMarketOpen();
  }

  return false;
};

/**
 * Fetch a URL with quick AbortController timeout
 */
const fetchWithTimeout = async (url: string, timeoutMs: number = 3000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

const fetchIndexFromYahoo = async (item: GlobalIndexQuote): Promise<GlobalIndexQuote> => {
  const freshUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?_cb=${Date.now()}`;
  
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(freshUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(freshUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(freshUrl)}&_ts=${Date.now()}`,
    freshUrl
  ];

  for (const targetUrl of proxies) {
    try {
      const res = await fetchWithTimeout(targetUrl, 2500);
      if (!res.ok) continue;
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta && (meta.regularMarketPrice !== undefined || meta.chartPreviousClose !== undefined)) {
        const price = parseFloat(meta.regularMarketPrice || meta.chartPreviousClose || item.price);
        const prevClose = parseFloat(meta.chartPreviousClose || meta.previousClose || price);
        const change = parseFloat((price - prevClose).toFixed(2));
        const changePct = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
        
        const isMarketOpen = checkIsMarketOpen(meta, item.category);
        const marketStateText = isMarketOpen ? '即時' : '盤後';

        return {
          ...item,
          price,
          change,
          changePct,
          isMarketOpen,
          marketStateText,
          updateTime: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
        };
      }
    } catch (e) {
      // Try next proxy
    }
  }

  // Fallback: If network fetch failed, evaluate marketState on existing item based on time
  const fallbackIsOpen = checkIsMarketOpen(null, item.category);
  return {
    ...item,
    isMarketOpen: fallbackIsOpen,
    marketStateText: fallbackIsOpen ? '即時' : '盤後'
  };
};

export const fetchAllGlobalIndices = async (
  currentList: GlobalIndexQuote[] = initialGlobalIndices
): Promise<GlobalIndexQuote[]> => {
  const promises = currentList.map(item => fetchIndexFromYahoo(item));
  const results = await Promise.all(promises);
  return results;
};
