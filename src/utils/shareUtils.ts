import { HoldingItem } from '../types/stock';

/**
 * Format a single holding item into the standardized share text format.
 * Format:
 * 股票（ETF）名稱：<name>
 * 股票代號：<symbol>
 * 買入價格：<buyPrice>
 * 股數：<shares>
 * 手續折扣：<discount>
 * 購買時間：<YYYYMMDD>
 */
export function generateShareText(item: HoldingItem): string {
  const dateRaw = item.date || new Date().toISOString().split('T')[0];
  const dateFormatted = dateRaw.replace(/-/g, '').replace(/\//g, '');
  const disc = item.discount !== undefined ? item.discount : 0.38;
  const buyPriceStr = item.buyPrice ? `\n買入價格：${item.buyPrice}` : '';

  return `股票（ETF）名稱：${item.name}
股票代號：${item.symbol}${buyPriceStr}
股數：${item.shares}
手續折扣：${disc}
購買時間：${dateFormatted}`;
}

/**
 * Format multiple holding items into share text format separated by newlines.
 */
export function generateShareTextForMultiple(items: HoldingItem[]): string {
  return items.map(generateShareText).join('\n\n');
}

/**
 * Parse shared text block(s) into partial HoldingItem array.
 */
export function parseShareText(text: string): Partial<HoldingItem>[] {
  if (!text || !text.trim()) return [];

  // Split by blank lines or headers
  const rawBlocks = text.split(/\n\s*\n+/);
  const results: Partial<HoldingItem>[] = [];

  for (const block of rawBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let name = '';
    let symbol = '';
    let buyPrice = 0;
    let shares = 0;
    let discount = 0.38;
    let date = new Date().toISOString().split('T')[0];

    let foundAnyField = false;

    for (const line of lines) {
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

    if (foundAnyField && (symbol || name || shares > 0)) {
      results.push({
        name: name || symbol,
        symbol: symbol || name,
        buyPrice,
        shares: shares || 1000,
        discount,
        date
      });
    }
  }

  return results;
}
