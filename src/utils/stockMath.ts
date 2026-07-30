import { AssetType, TradeTypeOption } from '../types/stock';

export const calcTradeDetails = (
  price: number,
  shares: number,
  discount: number | undefined,
  minFee: number | undefined,
  isBuy: boolean,
  assetType?: AssetType,
  tradeType?: TradeTypeOption,
  globalDiscount: number = 0.38
) => {
  const effDiscount = (discount !== undefined && discount !== null) ? discount : globalDiscount;
  const rawFee = price * shares * 0.001425 * effDiscount;
  const fee = Math.max(minFee !== undefined ? minFee : 20, Math.floor(rawFee));
  
  let tax = 0;
  if (!isBuy) {
    let taxRate = 0.003; // Standard 0.3%
    if (assetType === 'ETF') taxRate = 0.001; // ETF 0.1%
    if (tradeType && tradeType.includes('當沖')) taxRate = 0.0015; // Day-trading 0.15%
    tax = Math.floor(price * shares * taxRate);
  }

  return { fee, tax };
};

/**
 * Taiwan Stock Market & ETF Tick Size (升降單位/檔位)
 * 普通股票 (Stock):
 *   未滿 10 元: 0.01
 *   10 元至未滿 50 元: 0.05
 *   50 元至未滿 100 元: 0.10
 *   100 元至未滿 500 元: 0.50
 *   500 元至未滿 1000 元: 1.00
 *   1000 元以上: 5.00
 * 
 * ETF (受益憑證 / ETF):
 *   未滿 50 元: 0.01
 *   50 元以上: 0.05
 */
export const getTickSize = (price: number, assetType?: AssetType | string, symbol?: string): number => {
  const isEtf = assetType === 'ETF' || (symbol && symbol.toUpperCase().startsWith('00')) || false;
  if (isEtf) {
    if (price < 50) return 0.01;
    return 0.05;
  }

  if (price < 10) return 0.01;
  if (price < 50) return 0.05;
  if (price < 100) return 0.10;
  if (price < 500) return 0.50;
  if (price < 1000) return 1.00;
  return 5.00;
};

/**
 * Calculate total ticks (檔位數) between two prices across Taiwan stock/ETF tick thresholds
 */
export const calcTicksBetween = (
  fromPrice: number,
  toPrice: number,
  assetType?: AssetType | string,
  symbol?: string
): number => {
  if (fromPrice <= 0 || toPrice <= 0) return 0;
  const diff = Math.abs(toPrice - fromPrice);
  if (diff < 0.0001) return 0;

  const alignToTick = (p: number) => {
    const step = getTickSize(p, assetType, symbol);
    return parseFloat((Math.round(p / step) * step).toFixed(2));
  };

  let p1 = alignToTick(Math.min(fromPrice, toPrice));
  let p2 = alignToTick(Math.max(fromPrice, toPrice));
  if (Math.abs(p2 - p1) < 0.0001) return 0;

  let ticks = 0;
  let curr = p1;

  let safetyCounter = 0;
  while (curr < p2 - 0.0001 && safetyCounter < 10000) {
    safetyCounter++;
    const step = getTickSize(curr, assetType, symbol);
    curr = parseFloat((curr + step).toFixed(2));
    ticks++;
  }

  return ticks;
};

/**
 * Calculate breakeven price considering buy fee, sell fee, and sell tax, rounded to valid tick
 */
export const calcBreakEvenPrice = (
  buyPrice: number,
  discount: number | undefined,
  minFee: number | undefined,
  shares: number,
  assetType?: AssetType,
  tradeType?: TradeTypeOption,
  globalDiscount: number = 0.38,
  symbol?: string
): number => {
  if (!buyPrice || buyPrice <= 0 || !shares || shares <= 0) return 0;
  const buyFeeObj = calcTradeDetails(buyPrice, shares, discount, minFee, true, assetType, tradeType, globalDiscount);
  const totalBuyCost = (buyPrice * shares) + buyFeeObj.fee;

  const effDiscount = (discount !== undefined && discount !== null) ? discount : globalDiscount;
  const discountFeeRate = 0.001425 * effDiscount;
  let taxRate = 0.003;
  if (assetType === 'ETF' || (symbol && symbol.toUpperCase().startsWith('00'))) taxRate = 0.001;
  if (tradeType && tradeType.includes('當沖')) taxRate = 0.0015;

  let rawBreakEven = (totalBuyCost / shares) / (1 - discountFeeRate - taxRate);
  let tick = getTickSize(rawBreakEven, assetType, symbol);
  let candidate = Math.ceil(rawBreakEven / tick) * tick;
  candidate = parseFloat(candidate.toFixed(2));

  let safety = 0;
  while (safety < 200) {
    safety++;
    const sellObj = calcTradeDetails(candidate, shares, discount, minFee, false, assetType, tradeType, globalDiscount);
    const proceeds = (candidate * shares) - sellObj.fee - sellObj.tax;
    if (proceeds >= totalBuyCost) break;
    const step = getTickSize(candidate, assetType, symbol);
    candidate = parseFloat((candidate + step).toFixed(2));
  }

  return candidate;
};

export const formatNum = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Math.round(num).toLocaleString();
};

export const formatPct = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0.00%';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

export const getPnlColorClass = (val: number): string => {
  if (val > 0) return 'text-tw-up';
  if (val < 0) return 'text-tw-down';
  return 'text-slate-300';
};

export const getPriceChangeColorClass = (currentPrice: number, buyPrice: number): string => {
  if (currentPrice > buyPrice) return 'text-tw-up';
  if (currentPrice < buyPrice) return 'text-tw-down';
  return 'text-slate-200';
};

export interface EtfPremiumDiscountResult {
  diffPerShare: number;      // 單股折溢價金額 (市價 - 淨值)
  diffPct: number;          // 折溢價百分比 ((市價 - 淨值) / 淨值) * 100
  totalDiffAmount: number;  // 持股折溢價總額 (diffPerShare * shares)
  isPremium: boolean;       // 是否為溢價 (diffPerShare >= 0)
}

export const calcEtfPremiumDiscount = (
  marketPrice: number,
  nav: number | undefined,
  shares: number
): EtfPremiumDiscountResult | null => {
  if (!nav || nav <= 0 || !marketPrice || marketPrice <= 0) return null;
  
  const diffPerShare = marketPrice - nav;
  const diffPct = (diffPerShare / nav) * 100;
  const totalDiffAmount = Math.round(diffPerShare * shares);
  const isPremium = diffPerShare >= 0;

  return {
    diffPerShare,
    diffPct,
    totalDiffAmount,
    isPremium
  };
};

export interface TradeTypeStyle {
  label: string;
  shortLabel: string;
  badgeClass: string;
  cardBorder: string;
}

export const getTradeTypeStyle = (tradeType?: string): TradeTypeStyle => {
  if (!tradeType || tradeType.includes('現股交易')) {
    return {
      label: '多-現股買進',
      shortLabel: '現股交易',
      badgeClass: 'bg-blue-600/90 text-white border-blue-500/50',
      cardBorder: 'border-slate-200 dark:border-slate-700/80'
    };
  } else if (tradeType.includes('當沖')) {
    return {
      label: tradeType,
      shortLabel: tradeType.includes('多') ? '多-現股當沖' : (tradeType.includes('空') ? '空-現股當沖' : '現股當沖'),
      badgeClass: 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-sm',
      cardBorder: 'border-amber-400 dark:border-amber-500/80 ring-1 ring-amber-400/40'
    };
  } else if (tradeType.includes('資買資賣')) {
    return {
      label: '多-資買資賣',
      shortLabel: '資買資賣',
      badgeClass: 'bg-purple-600 text-white border-purple-400',
      cardBorder: 'border-purple-300 dark:border-purple-600/70'
    };
  } else if (tradeType.includes('資買券賣')) {
    return {
      label: '多-資買券賣',
      shortLabel: '資買券賣',
      badgeClass: 'bg-indigo-600 text-white border-indigo-400',
      cardBorder: 'border-indigo-300 dark:border-indigo-600/70'
    };
  } else if (tradeType.includes('券賣券買')) {
    return {
      label: '空-券賣券買',
      shortLabel: '券賣券買',
      badgeClass: 'bg-emerald-600 text-white border-emerald-400',
      cardBorder: 'border-emerald-300 dark:border-emerald-600/70'
    };
  } else if (tradeType.includes('券賣資買')) {
    return {
      label: '空-券賣資買',
      shortLabel: '券賣資買',
      badgeClass: 'bg-teal-600 text-white border-teal-400',
      cardBorder: 'border-teal-300 dark:border-teal-600/70'
    };
  }
  return {
    label: tradeType,
    shortLabel: tradeType,
    badgeClass: 'bg-slate-600 text-white border-slate-500',
    cardBorder: 'border-slate-200 dark:border-slate-700/80'
  };
};

