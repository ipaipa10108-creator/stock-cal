import React from 'react';
import { useStockStore } from '../../store/useStockStore';
import { calcTradeDetails, formatNum, getPnlColorClass } from '../../utils/stockMath';

export const ProfitSummaryModal: React.FC = () => {
  const {
    showProfitSummaryModal,
    setShowProfitSummaryModal,
    holdingTradeTypeFilter,
    holdingsData,
    currentAccountId,
    globalDiscount,
    accountLimitInput
  } = useStockStore();

  if (!showProfitSummaryModal) return null;

  const currentList = holdingsData[currentAccountId] || [];
  
  // Category totals
  let catPnl = 0;
  let catOutflow = 0;
  let catInflow = 0;
  let catMarketValue = 0;

  // Account totals
  let accCost = 0;
  let accInflow = 0;
  let accMarketValue = 0;
  let accPnl = 0;

  currentList.forEach(item => {
    const isShort = item.tradeType && item.tradeType.startsWith('空');
    const disc = item.discount !== undefined ? item.discount : globalDiscount;

    const buyFeeObj = calcTradeDetails(item.buyPrice, item.shares, disc, item.minFee || 20, true, item.assetType, item.tradeType, globalDiscount);
    const buyCost = (item.buyPrice * item.shares) + buyFeeObj.fee;

    const sellDetails = calcTradeDetails(item.currentPrice, item.shares, disc, item.minFee || 20, false, item.assetType, item.tradeType, globalDiscount);
    const estProceeds = (item.currentPrice * item.shares) - sellDetails.fee - sellDetails.tax;

    let unrealizedPnl = estProceeds - buyCost;
    if (isShort) unrealizedPnl = buyCost - estProceeds;

    const marketValue = item.currentPrice * item.shares;

    // Account totals
    accCost += buyCost;
    accInflow += estProceeds;
    accMarketValue += marketValue;
    accPnl += unrealizedPnl;

    // Category filter matching
    let isMatch = false;
    if (holdingTradeTypeFilter === '現股交易') {
      isMatch = !item.tradeType || item.tradeType.includes('現股交易');
    } else if (holdingTradeTypeFilter === '當沖交易') {
      isMatch = !!(item.tradeType && item.tradeType.includes('當沖'));
    } else if (holdingTradeTypeFilter === '信用交易') {
      isMatch = !!(item.tradeType && (item.tradeType.includes('資') || item.tradeType.includes('券')));
    } else {
      isMatch = true;
    }

    if (isMatch) {
      catPnl += unrealizedPnl;
      catOutflow += buyCost;
      catInflow += estProceeds;
      catMarketValue += marketValue;
    }
  });

  const remainingLimit = accountLimitInput ? accountLimitInput - accCost : null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-slate-700 rounded-xl w-full max-w-xs p-4 shadow-2xl space-y-3 relative text-slate-100">
        
        {/* 標題 */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h3 className="font-bold text-lg text-white">獲利試算</h3>
          <button onClick={() => setShowProfitSummaryModal(false)} className="text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* 分類 1: 目前選取的交易分類試算 */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="bg-slate-800 text-center py-1 font-bold text-sm text-slate-200 border-b border-slate-700">
            {holdingTradeTypeFilter}
          </div>
          <div className="p-2.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">未實現損益：</span>
              <span className={`font-bold text-sm ${getPnlColorClass(catPnl)}`}>
                {catPnl >= 0 ? '+' : ''}{formatNum(catPnl)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">匯出金額：</span>
              <span className="font-bold text-white text-sm">{formatNum(catOutflow)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">入帳金額：</span>
              <span className="font-bold text-white text-sm">{formatNum(catInflow)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">投資市值：</span>
              <span className="font-bold text-white text-sm">{formatNum(catMarketValue)}</span>
            </div>
          </div>
        </div>

        {/* 分類 2: 帳戶總體資訊 */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="bg-slate-800 text-center py-1 font-bold text-sm text-slate-200 border-b border-slate-700">
            帳戶資訊
          </div>
          <div className="p-2.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">未實現損益：</span>
              <span className={`font-bold text-sm ${getPnlColorClass(accPnl)}`}>
                {accPnl >= 0 ? '+' : ''}{formatNum(accPnl)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">總匯出金額：</span>
              <span className="font-bold text-white text-sm">{formatNum(accCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">總入帳金額：</span>
              <span className="font-bold text-white text-sm">{formatNum(accInflow)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">投資上限：</span>
              <span className="font-bold text-slate-300 text-sm">{accountLimitInput ? `$${formatNum(accountLimitInput)}` : '未設定'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">投資市值：</span>
              <span className="font-bold text-white text-sm">{formatNum(accMarketValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">尚可投資：</span>
              <span className="font-bold text-slate-300 text-sm">
                {remainingLimit !== null ? `$${formatNum(remainingLimit)}` : '未設定'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
