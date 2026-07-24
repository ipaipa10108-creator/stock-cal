import { StockQuote } from '../types/stock';

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

export const fetchSingleYahooQuote = async (code: string): Promise<StockQuote | null> => {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  const suffixes = ['.TW', '.TWO'];
  for (const suf of suffixes) {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${cleanCode}${suf}`);
      if (res.ok) {
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
          const price = cleanNum(meta.regularMarketPrice);
          const prevClose = cleanNum(meta.chartPreviousClose || meta.previousClose || price);
          const change = parseFloat((price - prevClose).toFixed(2));
          const changePct = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
          return {
            code: cleanCode,
            name: meta.shortName || meta.symbol || cleanCode,
            price,
            change,
            changePct,
            type: cleanCode.startsWith('00') ? 'ETF' : '股票'
          };
        }
      }
    } catch (e) {
      // Continue to next suffix
    }
  }
  return null;
};

export const fetchTwseOpenApiQuotes = async (): Promise<Record<string, StockQuote> | null> => {
  const result: Record<string, StockQuote> = {};

  // 1. Fetch TWSE Mainboard Quotes
  const twseUrls = [
    '/api/twse/v1/exchangeReport/STOCK_DAY_ALL',
    'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL'
  ];

  for (const url of twseUrls) {
    try {
      const twseRes = await fetch(url);
      if (twseRes.ok) {
        const data = await twseRes.json();
        if (Array.isArray(data) && data.length > 0) {
          data.forEach((stk: any) => {
            if (stk.Code && stk.ClosingPrice) {
              const closeP = cleanNum(stk.ClosingPrice);
              if (closeP > 0) {
                const changeVal = cleanNum(stk.Change);
                const codeUpper = stk.Code.trim().toUpperCase();
                result[codeUpper] = {
                  code: codeUpper,
                  name: (stk.Name || codeUpper).trim(),
                  price: closeP,
                  change: changeVal,
                  changePct: parseFloat(((changeVal / closeP) * 100).toFixed(2)),
                  type: codeUpper.startsWith('00') ? 'ETF' : '股票'
                };
              }
            }
          });
          break; // Stop trying fallback urls if success
        }
      }
    } catch (e) {
      console.warn(`TWSE quote fetch from ${url} notice:`, e);
    }
  }

  // 2. Fetch TPEx OTC Quotes (櫃買中心上櫃股票與 ETF)
  const tpexUrls = [
    '/api/tpex/openapi/v1/tpex_mainboard_quotes',
    'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes'
  ];

  for (const url of tpexUrls) {
    try {
      const tpexRes = await fetch(url);
      if (tpexRes.ok) {
        const data = await tpexRes.json();
        if (Array.isArray(data) && data.length > 0) {
          data.forEach((stk: any) => {
            const code = (stk.SecuritiesCompanyCode || stk.Code || stk.symbol || '').trim().toUpperCase();
            const name = (stk.CompanyName || stk.Name || stk.name || code).trim();
            const closeP = cleanNum(stk.Close || stk.ClosingPrice || stk.price);

            if (code && closeP > 0) {
              const changeVal = cleanNum(stk.Change || stk.change);
              result[code] = {
                code,
                name,
                price: closeP,
                change: changeVal,
                changePct: parseFloat(((changeVal / closeP) * 100).toFixed(2)),
                type: code.startsWith('00') ? 'ETF' : '股票'
              };
            }
          });
          break;
        }
      }
    } catch (e) {
      console.warn(`TPEx quote fetch from ${url} notice:`, e);
    }
  }

  return Object.keys(result).length > 0 ? result : null;
};

