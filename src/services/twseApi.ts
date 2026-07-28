import { StockQuote, ApiProvider } from '../types/stock';

export const checkTradingHours = (): boolean => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const twTime = new Date(utc + (3600000 * 8));
  const day = twTime.getDay();
  if (day === 0 || day === 6) return false;
  const mins = twTime.getHours() * 60 + twTime.getMinutes();
  return mins >= 540 && mins <= 810; // 09:00 - 13:30 TST
};

const cleanNum = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// CORS Proxy helper with cache buster to guarantee fresh live quotes
const fetchWithProxy = async (targetUrl: string): Promise<Response> => {
  const sep = targetUrl.includes('?') ? '&' : '?';
  const freshUrl = `${targetUrl}${sep}_cb=${Date.now()}`;

  // 1. Direct fetch
  try {
    const res = await fetch(freshUrl, { cache: 'no-store' });
    if (res.ok) return res;
  } catch (e) {
    // CORS or network error, fallback to proxy
  }

  // 2. corsproxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(freshUrl)}`;
    const res = await fetch(proxyUrl, { cache: 'no-store' });
    if (res.ok) return res;
  } catch (e) {
    // Continue to next proxy
  }

  // 3. allorigins.win with timestamp parameter
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(freshUrl)}&_ts=${Date.now()}`;
    const res = await fetch(proxyUrl, { cache: 'no-store' });
    if (res.ok) return res;
  } catch (e) {
    // Continue
  }

  // 4. codetabs proxy
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(freshUrl)}`;
    const res = await fetch(proxyUrl, { cache: 'no-store' });
    if (res.ok) return res;
  } catch (e) {
    // Continue
  }

  throw new Error(`Failed to fetch from ${targetUrl}`);
};

import { initialStockDictionary } from '../db/stockDictionary';

let cachedEtfNavMap: Record<string, number> | null = null;
let lastEtfNavFetchTime = 0;

/**
 * Fetch Real-Time ETF NAV Map from TWSE OpenAPI & Yahoo Finance
 */
export const fetchEtfNavMap = async (): Promise<Record<string, number>> => {
  const now = Date.now();
  if (cachedEtfNavMap && (now - lastEtfNavFetchTime < 60000)) {
    return cachedEtfNavMap;
  }

  const result: Record<string, number> = {};
  const etfNavUrls = [
    '/api/twse/v1/exchangeReport/ETF_REALTIME_SETTLEMENT_PRICE',
    'https://openapi.twse.com.tw/v1/exchangeReport/ETF_REALTIME_SETTLEMENT_PRICE'
  ];

  for (const url of etfNavUrls) {
    try {
      const res = await fetchWithProxy(url);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((stk: any) => {
          const code = (stk.Code || stk.symbol || '').trim().toUpperCase();
          const nav = cleanNum(stk.EstimatedNAV || stk.NAV || stk.Nav || stk.NetAssetValue || stk.nav);
          if (code && nav > 0) {
            result[code] = nav;
          }
        });
        if (Object.keys(result).length > 0) break;
      }
    } catch (e) {
      // Continue
    }
  }

  cachedEtfNavMap = result;
  lastEtfNavFetchTime = now;
  return result;
};

/**
 * 1. Single Yahoo Quote Fetch (Intraday Real-Time)
 */
export const fetchSingleYahooQuote = async (code: string): Promise<StockQuote | null> => {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  const dictName = initialStockDictionary[cleanCode]?.name;
  const isEtf = cleanCode.startsWith('00');

  const suffixes = ['.TW', '.TWO'];
  for (const suf of suffixes) {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanCode}${suf}`;
    try {
      const res = await fetchWithProxy(targetUrl);
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice) {
        const price = cleanNum(meta.regularMarketPrice);
        const prevClose = cleanNum(meta.chartPreviousClose || meta.previousClose || price);
        const change = parseFloat((price - prevClose).toFixed(2));
        const changePct = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;

        let nav = cleanNum(meta.navPrice || meta.netAssetValue);

        if (isEtf && (!nav || nav <= 0)) {
          const etfNavs = await fetchEtfNavMap();
          if (etfNavs[cleanCode]) nav = etfNavs[cleanCode];
        }

        let name = dictName;
        if (!name) {
          const rawName = meta.shortName || meta.symbol || cleanCode;
          if (/^[A-Za-z0-9\s.,&-]+$/.test(rawName) && dictName) {
            name = dictName;
          } else {
            name = rawName;
          }
        }

        return {
          code: cleanCode,
          name,
          price,
          change,
          changePct,
          type: isEtf ? 'ETF' : '股票',
          nav: nav > 0 ? nav : undefined
        };
      }
    } catch (e) {
      // Continue trying next suffix
    }
  }
  return null;
};

/**
 * 2. Batch Yahoo Finance Quotes Fetch (Intraday Real-Time)
 */
export const fetchYahooQuotesBatch = async (symbols: string[]): Promise<Record<string, StockQuote>> => {
  const result: Record<string, StockQuote> = {};
  if (!symbols || symbols.length === 0) return result;

  const unique = Array.from(new Set(symbols.map(s => s.trim().toUpperCase())));
  const promises = unique.map(async (sym) => {
    const q = await fetchSingleYahooQuote(sym);
    if (q) result[sym] = q;
  });

  await Promise.all(promises);
  return result;
};

/**
 * 3. TWSE Real-Time MIS API Fetch (證交所官方盤中即時行情)
 */
export const fetchTwseMisQuotesBatch = async (symbols: string[]): Promise<Record<string, StockQuote>> => {
  const result: Record<string, StockQuote> = {};
  if (!symbols || symbols.length === 0) return result;

  const etfNavs = await fetchEtfNavMap();

  const unique = Array.from(new Set(symbols.map(s => s.trim().toUpperCase())));
  const channels = unique.map(sym => {
    return (sym.startsWith('6') || sym.startsWith('8') || sym.startsWith('3')) ? `otc_${sym}.two` : `tse_${sym}.tw`;
  }).join('|');

  const targetUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${channels}&_=${Date.now()}`;

  try {
    const res = await fetchWithProxy(targetUrl);
    const data = await res.json();
    const msgArray = data?.msgArray;

    if (Array.isArray(msgArray)) {
      msgArray.forEach((stk: any) => {
        const code = (stk.c || '').trim().toUpperCase();
        const name = (stk.n || code).trim();
        const price = cleanNum(stk.z) || cleanNum(stk.a?.split('_')[0]) || cleanNum(stk.b?.split('_')[0]) || cleanNum(stk.y);
        const prevClose = cleanNum(stk.y) || price;

        if (code && price > 0) {
          const change = parseFloat((price - prevClose).toFixed(2));
          const changePct = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
          const isEtf = code.startsWith('00');
          const nav = isEtf ? etfNavs[code] : undefined;

          result[code] = {
            code,
            name,
            price,
            change,
            changePct,
            type: isEtf ? 'ETF' : '股票',
            nav
          };
        }
      });
    }
  } catch (e) {
    console.warn('TWSE MIS fetch notice:', e);
  }

  return result;
};

/**
 * 4. TWSE / TPEx Official OpenAPI Fetch (日盤/收盤後官方資料庫)
 */
export const fetchTwseOpenApiQuotes = async (): Promise<Record<string, StockQuote> | null> => {
  const result: Record<string, StockQuote> = {};
  const etfNavs = await fetchEtfNavMap();

  // 1. Fetch TWSE Mainboard Quotes
  const twseUrls = [
    '/api/twse/v1/exchangeReport/STOCK_DAY_ALL',
    'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL'
  ];

  for (const url of twseUrls) {
    try {
      const twseRes = await fetchWithProxy(url);
      const data = await twseRes.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((stk: any) => {
          if (stk.Code && stk.ClosingPrice) {
            const closeP = cleanNum(stk.ClosingPrice);
            if (closeP > 0) {
              const changeVal = cleanNum(stk.Change);
              const codeUpper = stk.Code.trim().toUpperCase();
              const isEtf = codeUpper.startsWith('00');
              result[codeUpper] = {
                code: codeUpper,
                name: (stk.Name || codeUpper).trim(),
                price: closeP,
                change: changeVal,
                changePct: parseFloat(((changeVal / closeP) * 100).toFixed(2)),
                type: isEtf ? 'ETF' : '股票',
                nav: isEtf ? etfNavs[codeUpper] : undefined
              };
            }
          }
        });
        break;
      }
    } catch (e) {
      console.warn(`TWSE quote fetch from ${url} notice:`, e);
    }
  }

  // 2. Fetch TPEx OTC Quotes (櫃買中心)
  const tpexUrls = [
    '/api/tpex/openapi/v1/tpex_mainboard_quotes',
    'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes'
  ];

  for (const url of tpexUrls) {
    try {
      const tpexRes = await fetchWithProxy(url);
      const data = await tpexRes.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((stk: any) => {
          const code = (stk.SecuritiesCompanyCode || stk.Code || stk.symbol || '').trim().toUpperCase();
          const name = (stk.CompanyName || stk.Name || stk.name || code).trim();
          const closeP = cleanNum(stk.Close || stk.ClosingPrice || stk.price);

          if (code && closeP > 0) {
            const changeVal = cleanNum(stk.Change || stk.change);
            const isEtf = code.startsWith('00');
            result[code] = {
              code,
              name,
              price: closeP,
              change: changeVal,
              changePct: parseFloat(((changeVal / closeP) * 100).toFixed(2)),
              type: isEtf ? 'ETF' : '股票',
              nav: isEtf ? etfNavs[code] : undefined
            };
          }
        });
        break;
      }
    } catch (e) {
      console.warn(`TPEx quote fetch from ${url} notice:`, e);
    }
  }

  return Object.keys(result).length > 0 ? result : null;
};

/**
 * Main Quote Provider Dispatcher
 */
export const fetchQuotesByProvider = async (
  symbols: string[],
  provider: ApiProvider
): Promise<{ quotes: Record<string, StockQuote>; sourceName: string }> => {
  let quotes: Record<string, StockQuote> = {};
  let sourceName = 'Yahoo 股市即時 API (含 ETF 估值 NAV)';

  if (provider === 'yahoo') {
    sourceName = 'Yahoo 股市即時 API (含 ETF 估值 NAV)';
    quotes = await fetchYahooQuotesBatch(symbols);
  } else if (provider === 'twse_mis') {
    sourceName = '證交所 MIS 即時 API (含 ETF 估值 NAV)';
    quotes = await fetchTwseMisQuotesBatch(symbols);
    const missing = symbols.filter(s => !quotes[s.toUpperCase()]);
    if (missing.length > 0) {
      const yahooBackup = await fetchYahooQuotesBatch(missing);
      quotes = { ...quotes, ...yahooBackup };
    }
  } else if (provider === 'twse_openapi') {
    sourceName = '證交所/櫃買 OpenAPI (每日日盤收盤檔)';
    const openApiQuotes = await fetchTwseOpenApiQuotes();
    if (openApiQuotes) {
      symbols.forEach(s => {
        const upper = s.toUpperCase();
        if (openApiQuotes[upper]) quotes[upper] = openApiQuotes[upper];
      });
    }
  } else {
    // 'auto'
    sourceName = '自動智選 (Yahoo/MIS 即時行情與 ETF 估值)';
    quotes = await fetchYahooQuotesBatch(symbols);
    if (Object.keys(quotes).length < symbols.length) {
      const misQuotes = await fetchTwseMisQuotesBatch(symbols);
      quotes = { ...misQuotes, ...quotes };
    }
    if (Object.keys(quotes).length === 0) {
      const openApiQuotes = await fetchTwseOpenApiQuotes();
      if (openApiQuotes) quotes = openApiQuotes;
    }
  }

  return { quotes, sourceName };
};
