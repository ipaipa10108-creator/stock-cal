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

export interface MaintenanceRatioResult {
  ratio: number;                   // 維持率百分比 (e.g. 166.67)
  formattedRatio: string;          // 格式化字串 (e.g. "166.67%")
  loanOrCollateralAmount: number; // 融資借款金額 或 融券擔保品總額 (賣出價款 + 保證金)
  liabilityAmount: number;         // 融資借款金額 或 融券股票當前市值
  liquidationPrice: number;        // 130% 斷頭追繳觸發價格
  initialRatio: number;            // 買進/賣出初始維持率
  status: 'safe' | 'caution' | 'warning' | 'danger'; // 安全 | 觀察 | 預警 | 追繳斷頭
  statusLabel: string;             // "維持安全" | "警戒觀察" | "追繳預警" | "斷頭追繳"
  badgeClass: string;              // UI Badge CSS class
  textClass: string;               // Text color class
  isMarginLong: boolean;           // 是否為融資
  isMarginShort: boolean;          // 是否為融券
  marginRate: number;              // 融資成數 (預設 0.6)
  shortMarginRate: number;         // 融券保證金成數 (預設 0.9)
}

/**
 * 計算單筆信用交易 (融資 / 融券) 之維持率與 130% 斷頭觸發價格
 */
export const calcMarginMaintenanceRatio = (
  buyOrSellPrice: number,
  currentPrice: number,
  shares: number,
  tradeType?: string,
  marginRate: number = 0.6,     // 融資成數預設 60% (0.6)
  shortMarginRate: number = 0.9 // 融券保證金成數預設 90% (0.9)
): MaintenanceRatioResult | null => {
  if (!tradeType || buyOrSellPrice <= 0 || currentPrice <= 0 || shares <= 0) {
    return null;
  }

  const isMarginLong = tradeType.includes('資');
  const isMarginShort = tradeType.includes('券');

  if (!isMarginLong && !isMarginShort) {
    return null;
  }

  let loanOrCollateralAmount = 0;
  let liabilityAmount = 0;
  let ratio = 0;
  let liquidationPrice = 0;
  let initialRatio = 0;

  if (isMarginLong) {
    // 融資維持率 = 股票市值 ÷ 融資金額 × 100%
    // 融資借款金額 = 買價 × 股數 × 0.6
    loanOrCollateralAmount = buyOrSellPrice * shares * marginRate;
    liabilityAmount = loanOrCollateralAmount;
    const currentMarketValue = currentPrice * shares;
    ratio = loanOrCollateralAmount > 0 ? (currentMarketValue / loanOrCollateralAmount) * 100 : 0;
    initialRatio = (1 / marginRate) * 100; // ~166.67%
    // 130% 斷頭觸發價格 = 買價 × 融資成數 × 1.3
    liquidationPrice = parseFloat((buyOrSellPrice * marginRate * 1.3).toFixed(2));
  } else {
    // 融券維持率 = (融券賣出價款 + 融券保證金) ÷ 當前股票市值 × 100%
    // 融券擔保品總額 = 賣價 × 股數 × (1 + 0.9)
    loanOrCollateralAmount = buyOrSellPrice * shares * (1 + shortMarginRate);
    const currentMarketValue = currentPrice * shares;
    liabilityAmount = currentMarketValue;
    ratio = currentMarketValue > 0 ? (loanOrCollateralAmount / currentMarketValue) * 100 : 0;
    initialRatio = (1 + shortMarginRate) * 100; // 190.00%
    // 130% 斷頭觸發價格 = (賣價 × (1 + 保證金成數)) ÷ 1.3
    liquidationPrice = parseFloat(((buyOrSellPrice * (1 + shortMarginRate)) / 1.3).toFixed(2));
  }

  let status: 'safe' | 'caution' | 'warning' | 'danger' = 'safe';
  let statusLabel = '維持安全';
  let badgeClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40';
  let textClass = 'text-emerald-600 dark:text-emerald-400';

  if (ratio < 130) {
    status = 'danger';
    statusLabel = '斷頭追繳';
    badgeClass = 'bg-rose-600 text-white font-black animate-pulse border border-rose-600 shadow-md';
    textClass = 'text-rose-500 font-extrabold';
  } else if (ratio < 140) {
    status = 'warning';
    statusLabel = '追繳預警';
    badgeClass = 'bg-amber-500 text-slate-950 font-black border border-amber-400 shadow';
    textClass = 'text-amber-500 font-bold';
  } else if (ratio < 160) {
    status = 'caution';
    statusLabel = '警戒觀察';
    badgeClass = 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40';
    textClass = 'text-blue-500 font-semibold';
  }

  return {
    ratio,
    formattedRatio: `${ratio.toFixed(2)}%`,
    loanOrCollateralAmount,
    liabilityAmount,
    liquidationPrice,
    initialRatio,
    status,
    statusLabel,
    badgeClass,
    textClass,
    isMarginLong,
    isMarginShort,
    marginRate,
    shortMarginRate
  };
};

export interface AccountMaintenanceRatioResult {
  totalRatio: number;                     // 整戶維持率 (%)
  formattedTotalRatio: string;            // 格式化百分比 (e.g. "165.20%")
  totalLongValue: number;                 // 所有融資股票當前市值
  totalLongLoan: number;                  // 所有融資借款金額
  totalShortCollateral: number;           // 所有融券擔保品總額 (賣出價款 + 保證金)
  totalShortMarketValue: number;         // 所有融券股票當前市值
  totalNumerator: number;                 // 整戶分子 = totalLongValue + totalShortCollateral
  totalDenominator: number;               // 整戶分母 = totalLongLoan + totalShortMarketValue
  creditHoldingsCount: number;            // 信用交易筆數
  status: 'safe' | 'caution' | 'warning' | 'danger';
  statusLabel: string;
  badgeClass: string;
  textClass: string;
}

/**
 * 計算整戶信用交易 (融資 + 融券) 擔保維持率
 */
export const calcAccountMarginMaintenanceRatio = (
  holdings: Array<{
    buyPrice: number;
    currentPrice: number;
    shares: number;
    tradeType?: string;
  }>,
  marginRate: number = 0.6,
  shortMarginRate: number = 0.9
): AccountMaintenanceRatioResult | null => {
  let totalLongValue = 0;
  let totalLongLoan = 0;
  let totalShortCollateral = 0;
  let totalShortMarketValue = 0;
  let creditHoldingsCount = 0;

  holdings.forEach(item => {
    if (!item.tradeType || item.buyPrice <= 0 || item.currentPrice <= 0 || item.shares <= 0) return;

    const isMarginLong = item.tradeType.includes('資');
    const isMarginShort = item.tradeType.includes('券');

    if (isMarginLong) {
      creditHoldingsCount++;
      const longLoan = item.buyPrice * item.shares * marginRate;
      const longValue = item.currentPrice * item.shares;
      totalLongLoan += longLoan;
      totalLongValue += longValue;
    } else if (isMarginShort) {
      creditHoldingsCount++;
      const shortCollateral = item.buyPrice * item.shares * (1 + shortMarginRate);
      const shortMarketValue = item.currentPrice * item.shares;
      totalShortCollateral += shortCollateral;
      totalShortMarketValue += shortMarketValue;
    }
  });

  if (creditHoldingsCount === 0) return null;

  const totalNumerator = totalLongValue + totalShortCollateral;
  const totalDenominator = totalLongLoan + totalShortMarketValue;
  const totalRatio = totalDenominator > 0 ? (totalNumerator / totalDenominator) * 100 : 0;

  let status: 'safe' | 'caution' | 'warning' | 'danger' = 'safe';
  let statusLabel = '整戶維持安全';
  let badgeClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40';
  let textClass = 'text-emerald-600 dark:text-emerald-400';

  if (totalRatio < 130) {
    status = 'danger';
    statusLabel = '整戶斷頭警戒';
    badgeClass = 'bg-rose-600 text-white font-black animate-pulse border border-rose-600 shadow-md';
    textClass = 'text-rose-500 font-extrabold';
  } else if (totalRatio < 140) {
    status = 'warning';
    statusLabel = '整戶追繳預警';
    badgeClass = 'bg-amber-500 text-slate-950 font-black border border-amber-400 shadow';
    textClass = 'text-amber-500 font-bold';
  } else if (totalRatio < 160) {
    status = 'caution';
    statusLabel = '整戶維持觀察';
    badgeClass = 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40';
    textClass = 'text-blue-500 font-semibold';
  }

  return {
    totalRatio,
    formattedTotalRatio: `${totalRatio.toFixed(2)}%`,
    totalLongValue,
    totalLongLoan,
    totalShortCollateral,
    totalShortMarketValue,
    totalNumerator,
    totalDenominator,
    creditHoldingsCount,
    status,
    statusLabel,
    badgeClass,
    textClass
  };
};


