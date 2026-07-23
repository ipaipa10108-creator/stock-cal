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
