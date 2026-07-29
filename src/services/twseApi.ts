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
 * Fetch Real-Time ETF NAV Map from TWSE MIS API & Yahoo Finance
 */
export const fetchEtfNavMap = async (): Promise<Record<string, number>> => {
  const now = Date.now();
  if (cachedEtfNavMap && (now - lastEtfNavFetchTime < 60000)) {
    return cachedEtfNavMap;
  }

  const result: Record<string, number> = {};
  const popularEtfs = [
    '0050', '0056', '00878', '00919', '00929', '006208', '00713', '00940',
    '00915', '00918', '00922', '00939', '00935', '00881', '00830', '00946',
    '00679B', '00687B', '00937B', '00923', '00936', '00941', '00900'
  ];

  try {
    const channels = popularEtfs.map(sym => `tse_${sym}.tw|otc_${sym}.two`).join('|');
    const targetUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${channels}&_=${now}`;
    const res = await fetchWithProxy(targetUrl);
    const data = await res.json();
    const msgArray = data?.msgArray;

    if (Array.isArray(msgArray)) {
      msgArray.forEach((stk: any) => {
        const code = (stk.c || '').trim().toUpperCase().replace(/\.(TW|TWO)$/i, '');
        const price = cleanNum(stk.z) || cleanNum(stk.a?.split('_')[0]) || cleanNum(stk.b?.split('_')[0]) || cleanNum(stk.y);
        const estNav = cleanNum(stk.fv || stk.oa || stk.ob || stk.nav);
        if (code && estNav > 0) {
          result[code] = estNav;
        } else if (code && price > 0) {
          result[code] = price;
        }
      });
    }
  } catch (e) {
    // Continue
  }

  cachedEtfNavMap = result;
  lastEtfNavFetchTime = now;
  return result;
};

/**
 * 1. Single Yahoo Quote Fetch (Intraday Delayed ~15-20m)
 */
export const fetchSingleYahooQuote = async (code: string): Promise<StockQuote | null> => {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase().replace(/\.(TW|TWO)$/i, '');
  if (!cleanCode) return null;

  const dictName = initialStockDictionary[cleanCode]?.name;
  const isEtf = cleanCode.startsWith('00') || dictName?.includes('ETF') || false;

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

        if (isEtf) {
          const etfNavs = await fetchEtfNavMap();
          if (etfNavs[cleanCode] && etfNavs[cleanCode] > 0) {
            nav = etfNavs[cleanCode];
          } else if (!nav || nav <= 0) {
            nav = price;
          }
        }

        let name = dictName;
        if (!name) {
          const rawName = meta.shortName || meta.symbol || cleanCode;
          if (/^[A-Za-z0-9\s.,&-]+$/.test(rawName)) {
            try {
              const misQuote = await fetchTwseMisQuotesBatch([cleanCode]);
              if (misQuote[cleanCode]?.name && !/^[A-Za-z0-9\s.,&-]+$/.test(misQuote[cleanCode].name)) {
                name = misQuote[cleanCode].name;
              } else {
                name = rawName;
              }
            } catch (e) {
              name = rawName;
            }
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
          nav: isEtf ? (nav && nav > 0 ? nav : price) : undefined
        };
      }
    } catch (e) {
      // Continue trying next suffix
    }
  }
  return null;
};

/**
 * 2. Single Quote Fetcher prioritizing TWSE MIS 0-delay real-time quotes
 */
export const fetchSingleQuote = async (code: string): Promise<StockQuote | null> => {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase().replace(/\.(TW|TWO)$/i, '');
  if (!cleanCode) return null;

  try {
    const misMap = await fetchTwseMisQuotesBatch([cleanCode]);
    if (misMap[cleanCode] && misMap[cleanCode].price > 0) {
      return misMap[cleanCode];
    }
  } catch (e) {
    // Continue to Yahoo fallback
  }

  return await fetchSingleYahooQuote(cleanCode);
};

/**
 * 3. Batch Yahoo Finance Quotes Fetch
 */
export const fetchYahooQuotesBatch = async (symbols: string[]): Promise<Record<string, StockQuote>> => {
  const result: Record<string, StockQuote> = {};
  if (!symbols || symbols.length === 0) return result;

  const unique = Array.from(new Set(symbols.map(s => s.trim().toUpperCase().replace(/\.(TW|TWO)$/i, ''))));
  const promises = unique.map(async (sym) => {
    const q = await fetchSingleYahooQuote(sym);
    if (q) result[sym] = q;
  });

  await Promise.all(promises);
  return result;
};

/**
 * 4. TWSE Real-Time MIS API Fetch (證交所官方盤中 0 延遲即時行情)
 */
export const fetchTwseMisQuotesBatch = async (symbols: string[]): Promise<Record<string, StockQuote>> => {
  const result: Record<string, StockQuote> = {};
  if (!symbols || symbols.length === 0) return result;

  const etfNavs = await fetchEtfNavMap();

  const unique = Array.from(new Set(symbols.map(s => s.trim().toUpperCase().replace(/\.(TW|TWO)$/i, ''))));
  const channels = unique.map(sym => `tse_${sym}.tw|otc_${sym}.two`).join('|');

  const targetUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${channels}&_=${Date.now()}`;

  try {
    const res = await fetchWithProxy(targetUrl);
    const data = await res.json();
    const msgArray = data?.msgArray;

    if (Array.isArray(msgArray)) {
      msgArray.forEach((stk: any) => {
        const code = (stk.c || '').trim().toUpperCase().replace(/\.(TW|TWO)$/i, '');
        if (!code) return;

        const dictName = initialStockDictionary[code]?.name;
        const name = (stk.n && !/^[A-Za-z0-9\s.,&-]+$/.test(stk.n)) ? stk.n.trim() : (dictName || stk.n || code).trim();
        const price = cleanNum(stk.z) || cleanNum(stk.a?.split('_')[0]) || cleanNum(stk.b?.split('_')[0]) || cleanNum(stk.y);
        const prevClose = cleanNum(stk.y) || price;

        if (code && price > 0) {
          const change = parseFloat((price - prevClose).toFixed(2));
          const changePct = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
          const isEtf = code.startsWith('00') || dictName?.includes('ETF') || false;
          const nav = isEtf ? (etfNavs[code] || price) : undefined;

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
 * 5. TWSE / TPEx Official OpenAPI Fetch (日盤/收盤後官方資料庫)
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
              const codeUpper = stk.Code.trim().toUpperCase().replace(/\.(TW|TWO)$/i, '');
              const isEtf = codeUpper.startsWith('00');
              result[codeUpper] = {
                code: codeUpper,
                name: (stk.Name || codeUpper).trim(),
                price: closeP,
                change: changeVal,
                changePct: parseFloat(((changeVal / closeP) * 100).toFixed(2)),
                type: isEtf ? 'ETF' : '股票',
                nav: isEtf ? (etfNavs[codeUpper] || closeP) : undefined
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
          const code = (stk.SecuritiesCompanyCode || stk.Code || stk.symbol || '').trim().toUpperCase().replace(/\.(TW|TWO)$/i, '');
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
              nav: isEtf ? (etfNavs[code] || closeP) : undefined
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
  let sourceName = '證交所 MIS 零延遲即時 API (含 ETF 估值 NAV)';

  if (provider === 'yahoo') {
    sourceName = 'Yahoo 股市即時 API (含 ETF 估值 NAV)';
    quotes = await fetchYahooQuotesBatch(symbols);
    const missing = symbols.filter(s => !quotes[s.toUpperCase().replace(/\.(TW|TWO)$/i, '')]);
    if (missing.length > 0) {
      const misBackup = await fetchTwseMisQuotesBatch(missing);
      quotes = { ...quotes, ...misBackup };
    }
  } else if (provider === 'twse_mis') {
    sourceName = '證交所 MIS 零延遲即時 API (含 ETF 估值 NAV)';
    quotes = await fetchTwseMisQuotesBatch(symbols);
    const missing = symbols.filter(s => !quotes[s.toUpperCase().replace(/\.(TW|TWO)$/i, '')]);
    if (missing.length > 0) {
      const yahooBackup = await fetchYahooQuotesBatch(missing);
      quotes = { ...quotes, ...yahooBackup };
    }
  } else if (provider === 'twse_openapi') {
    sourceName = '證交所/櫃買 OpenAPI (每日日盤收盤檔)';
    const openApiQuotes = await fetchTwseOpenApiQuotes();
    if (openApiQuotes) {
      symbols.forEach(s => {
        const upper = s.toUpperCase().replace(/\.(TW|TWO)$/i, '');
        if (openApiQuotes[upper]) quotes[upper] = openApiQuotes[upper];
      });
    }
  } else {
    // 'auto' - Default: Priority 0-delay TWSE MIS real-time quotes, backed up by Yahoo Finance
    sourceName = '自動智選 (證交所 MIS 零延遲即時行情與 ETF 估值)';
    quotes = await fetchTwseMisQuotesBatch(symbols);
    
    // Backup any missing symbols with Yahoo
    const missing = symbols.filter(s => !quotes[s.toUpperCase().replace(/\.(TW|TWO)$/i, '')]);
    if (missing.length > 0) {
      const yahooBackup = await fetchYahooQuotesBatch(missing);
      quotes = { ...quotes, ...yahooBackup };
    }

    if (Object.keys(quotes).length === 0) {
      const openApiQuotes = await fetchTwseOpenApiQuotes();
      if (openApiQuotes) quotes = openApiQuotes;
    }
  }

  return { quotes, sourceName };
};
