import { HoldingItem, HoldingLot } from '../types/stock';
import { calcTradeDetails } from './stockMath';

/**
 * Format a single holding item into the standardized share text format.
 * Includes current price, unrealized PnL, return rate, and lot details if present.
 */
export function generateShareText(item: HoldingItem, globalDiscount = 0.38): string {
  const dateRaw = item.date || new Date().toISOString().split('T')[0];
  const dateFormatted = dateRaw.replace(/-/g, '').replace(/\//g, '');
  const disc = item.discount !== undefined ? item.discount : globalDiscount;
  const buyPriceStr = item.buyPrice ? `\n買入價格：${item.buyPrice}` : '';

  let priceAndPnlStr = '';
  const curPrice = item.currentPrice || 0;
  if (curPrice > 0) {
    const isShort = item.tradeType && item.tradeType.startsWith('空');
    const buyFeeObj = calcTradeDetails(item.buyPrice, item.shares, disc, item.minFee || 20, true, item.assetType, item.tradeType, globalDiscount);
    const buyCost = (item.buyPrice * item.shares) + buyFeeObj.fee;

    const sellDetails = calcTradeDetails(curPrice, item.shares, disc, item.minFee || 20, false, item.assetType, item.tradeType, globalDiscount);
    const estProceeds = (curPrice * item.shares) - sellDetails.fee - sellDetails.tax;

    let unrealizedPnl = estProceeds - buyCost;
    if (isShort) unrealizedPnl = buyCost - estProceeds;

    const unrealizedPnlPct = buyCost > 0 ? (unrealizedPnl / buyCost) * 100 : 0;

    const pnlSign = unrealizedPnl >= 0 ? '+' : '';
    const pctSign = unrealizedPnlPct >= 0 ? '+' : '';
    const formattedPnl = Math.round(unrealizedPnl).toLocaleString('en-US');
    const formattedPct = unrealizedPnlPct.toFixed(2);

    priceAndPnlStr = `\n當前股價：${curPrice}\n未實現損益：${pnlSign}${formattedPnl}\n當下報酬率：${pctSign}${formattedPct}%`;
  }

  let lotsStr = '';
  if (item.lots && item.lots.length > 1) {
    const lotLines = item.lots.map((lot, idx) => {
      const lotDateRaw = lot.date || dateRaw;
      const lotDateFormatted = lotDateRaw.replace(/-/g, '').replace(/\//g, '');
      return `  - 第 ${idx + 1} 筆：購買時間：${lotDateFormatted}，買價：${lot.buyPrice}，股數：${lot.shares}`;
    });
    lotsStr = `\n分批購買明細：\n${lotLines.join('\n')}`;
  }

  return `股票（ETF）名稱：${item.name}
股票代號：${item.symbol}${buyPriceStr}
股數：${item.shares}
手續折扣：${disc}
購買時間：${dateFormatted}${priceAndPnlStr}${lotsStr}`;
}

/**
 * Format multiple holding items into share text format separated by newlines.
 */
export function generateShareTextForMultiple(items: HoldingItem[], globalDiscount = 0.38): string {
  return items.map(item => generateShareText(item, globalDiscount)).join('\n\n');
}

/**
 * Parse shared text block(s) into partial HoldingItem array.
 */
export function parseShareText(text: string): Partial<HoldingItem>[] {
  if (!text || !text.trim()) return [];

  // Split by blank lines or multiple newlines
  const rawBlocks = text.split(/\n\s*\n+/);
  const results: Partial<HoldingItem>[] = [];

  for (const block of rawBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let name = '';
    let symbol = '';
    let buyPrice = 0;
    let currentPrice = 0;
    let shares = 0;
    let discount = 0.38;
    let date = new Date().toISOString().split('T')[0];
    const lots: HoldingLot[] = [];

    let foundAnyField = false;

    for (const line of lines) {
      // Check if line is a lot detail line (e.g. contains '筆' or starts with '-' / '*')
      const isLotLine = (line.includes('筆') || line.startsWith('-') || line.startsWith('*')) && (line.includes('買') || line.includes('股') || line.includes('時間') || line.includes('日期'));
      
      if (isLotLine) {
        // Parse lot details
        let lotDate = date;
        const dateMatch = line.match(/(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
        if (dateMatch) {
          lotDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        }

        let lotPrice = 0;
        const priceMatch = line.match(/(?:買[價格]|買價|單價|價格)[:：\s]*[$]*([0-9.]+)/i);
        if (priceMatch) {
          lotPrice = parseFloat(priceMatch[1]);
        }

        let lotShares = 0;
        const sharesMatch = line.match(/(?:股數)[:：\s]*([0-9,]+)/i) || line.match(/([0-9,.]+)\s*股/i);
        const changMatch = line.match(/([0-9,.]+)\s*張/i);
        if (sharesMatch) {
          lotShares = parseFloat(sharesMatch[1].replace(/,/g, ''));
        } else if (changMatch) {
          lotShares = parseFloat(changMatch[1].replace(/,/g, '')) * 1000;
        }

        if (lotPrice > 0 || lotShares > 0) {
          lots.push({
            id: 'lot-imported-' + lots.length + '-' + Math.random().toString(36).substr(2, 4),
            buyPrice: lotPrice || buyPrice || 0,
            shares: lotShares || 1000,
            date: lotDate
          });
          foundAnyField = true;
          continue;
        }
      }

      // Split line by colon (either full-width '：' or half-width ':')
      const colonIdx = line.search(/[:：]/);
      if (colonIdx === -1) continue;

      const label = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();

      if (/股票.*名稱|ETF.*名稱|名稱/i.test(label)) {
        name = val;
        foundAnyField = true;
      } else if (/股票.*代號|代號|Symbol/i.test(label)) {
        symbol = val.toUpperCase();
        foundAnyField = true;
      } else if (/當前股價|現價|CurrentPrice/i.test(label)) {
        const num = parseFloat(val.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) currentPrice = num;
        foundAnyField = true;
      } else if (/買入.*價|買價|單價|價格|Price/i.test(label)) {
        const num = parseFloat(val.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) buyPrice = num;
        foundAnyField = true;
      } else if (/股數|張數|Shares/i.test(label)) {
        let num = parseFloat(val.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) {
          if (val.includes('張')) num = num * 1000;
          shares = num;
        }
        foundAnyField = true;
      } else if (/手續.*折扣|折扣|Discount/i.test(label)) {
        let num = parseFloat(val.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) {
          if (num > 1 && num <= 10) num = num / 10;
          else if (num > 10) num = num / 100;
          discount = num;
        }
        foundAnyField = true;
      } else if (/購買.*時間|購買.*日期|時間|日期|Date/i.test(label)) {
        const cleanVal = val.replace(/[^0-9]/g, '');
        if (cleanVal.length === 8) {
          date = `${cleanVal.slice(0, 4)}-${cleanVal.slice(4, 6)}-${cleanVal.slice(6, 8)}`;
        } else if (val.includes('-') || val.includes('/')) {
          const parts = val.split(/[-/]/);
          if (parts.length === 3) {
            const y = parts[0].padStart(4, '20');
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            date = `${y}-${m}-${d}`;
          }
        }
        foundAnyField = true;
      }
    }

    if (foundAnyField && (symbol || name || shares > 0 || lots.length > 0)) {
      let finalBuyPrice = buyPrice;
      let finalShares = shares;

      if (lots.length > 0) {
        if (!finalShares || finalShares === 0) {
          finalShares = lots.reduce((sum, l) => sum + l.shares, 0);
        }
        if (!finalBuyPrice || finalBuyPrice === 0) {
          const totalCostSum = lots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
          finalBuyPrice = finalShares > 0 ? parseFloat((totalCostSum / finalShares).toFixed(2)) : 0;
        }
      }

      results.push({
        name: name || symbol,
        symbol: symbol || name,
        buyPrice: finalBuyPrice,
        currentPrice: currentPrice || undefined,
        shares: finalShares || 1000,
        discount,
        date,
        lots: lots.length > 0 ? lots : undefined
      });
    }
  }

  return results;
}

