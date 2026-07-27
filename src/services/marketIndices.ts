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

const fetchIndexFromYahoo = async (item: GlobalIndexQuote): Promise<GlobalIndexQuote> => {
  const freshUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?_cb=${Date.now()}`;
  
  const proxies = [
    freshUrl,
    `https://corsproxy.io/?${encodeURIComponent(freshUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(freshUrl)}&_ts=${Date.now()}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(freshUrl)}`
  ];

  for (const targetUrl of proxies) {
    try {
      const res = await fetch(targetUrl, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice) {
        const price = parseFloat(meta.regularMarketPrice);
        const prevClose = parseFloat(meta.chartPreviousClose || meta.previousClose || price);
        const change = parseFloat((price - prevClose).toFixed(2));
        const changePct = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
        const marketState = (meta.marketState || '').toUpperCase();
        const isMarketOpen = marketState === 'REGULAR';
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

  return item;
};

export const fetchAllGlobalIndices = async (
  currentList: GlobalIndexQuote[] = initialGlobalIndices
): Promise<GlobalIndexQuote[]> => {
  const promises = currentList.map(item => fetchIndexFromYahoo(item));
  const results = await Promise.all(promises);
  return results;
};
