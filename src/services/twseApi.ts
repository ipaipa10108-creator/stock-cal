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

export const fetchTwseOpenApiQuotes = async (): Promise<Record<string, StockQuote> | null> => {
  const result: Record<string, StockQuote> = {};

  try {
    // 1. Fetch TWSE Mainboard Quotes
    const twseRes = await fetch('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL');
    if (twseRes.ok) {
      const data = await twseRes.json();
      data.forEach((stk: any) => {
        if (stk.Code && stk.ClosingPrice) {
          const closeP = parseFloat(stk.ClosingPrice);
          if (!isNaN(closeP) && closeP > 0) {
            const changeVal = parseFloat(stk.Change) || 0;
            const codeUpper = stk.Code.trim().toUpperCase();
            result[codeUpper] = {
              code: codeUpper,
              name: stk.Name || codeUpper,
              price: closeP,
              change: changeVal,
              changePct: parseFloat(((changeVal / closeP) * 100).toFixed(2)),
              type: codeUpper.startsWith('00') ? 'ETF' : '股票'
            };
          }
        }
      });
    }
  } catch (e) {
    console.warn('TWSE OpenAPI fetch notice:', e);
  }

  try {
    // 2. Fetch TPEx OTC Quotes (櫃買中心上櫃股票與 ETF)
    const tpexRes = await fetch('https://openapi.twse.com.tw/v1/tpex/tpex_mainboard_quotes');
    if (tpexRes.ok) {
      const data = await tpexRes.json();
      data.forEach((stk: any) => {
        const code = (stk.SecuritiesCompanyCode || stk.Code || stk.symbol || '').trim().toUpperCase();
        const name = stk.CompanyName || stk.Name || stk.name || code;
        const closeP = parseFloat(stk.Close || stk.ClosingPrice || stk.price);

        if (code && !isNaN(closeP) && closeP > 0) {
          const changeVal = parseFloat(stk.Change || stk.change) || 0;
          result[code] = {
            code: code,
            name: name,
            price: closeP,
            change: changeVal,
            changePct: parseFloat(((changeVal / closeP) * 100).toFixed(2)),
            type: code.startsWith('00') ? 'ETF' : '股票'
          };
        }
      });
    }
  } catch (e) {
    console.warn('TPEx OpenAPI fetch notice:', e);
  }

  return Object.keys(result).length > 0 ? result : null;
};
