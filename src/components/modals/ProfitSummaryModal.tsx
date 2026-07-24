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
    accountLimitInput,
    themeMode
  } = useStockStore();

  if (!showProfitSummaryModal) return null;

  const isLight = themeMode === 'light';
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
      <div className={`rounded-xl w-full max-w-xs p-4 shadow-2xl space-y-3 relative border transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
      }`}>
        
        {/* 標題 */}
        <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <h3 className="font-bold text-lg">獲利試算</h3>
          <button onClick={() => setShowProfitSummaryModal(false)} className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* 分類 1: 目前選取的交易分類試算 */}
        <div className={`border rounded-lg overflow-hidden ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`text-center py-1 font-bold text-sm border-b ${
            isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800 text-slate-200 border-slate-700'
          }`}>
            {holdingTradeTypeFilter}
          </div>
          <div className="p-2.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>未實現損益：</span>
              <span className={`font-black text-sm ${getPnlColorClass(catPnl)}`}>
                {catPnl >= 0 ? '+' : ''}{formatNum(catPnl)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>匯出金額：</span>
              <span className="font-bold text-sm">{formatNum(catOutflow)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>入帳金額：</span>
              <span className="font-bold text-sm">{formatNum(catInflow)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>投資市值：</span>
              <span className="font-bold text-sm">{formatNum(catMarketValue)}</span>
            </div>
          </div>
        </div>

        {/* 分類 2: 帳戶總體資訊 */}
        <div className={`border rounded-lg overflow-hidden ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`text-center py-1 font-bold text-sm border-b ${
            isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800 text-slate-200 border-slate-700'
          }`}>
            帳戶資訊
          </div>
          <div className="p-2.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>未實現損益：</span>
              <span className={`font-black text-sm ${getPnlColorClass(accPnl)}`}>
                {accPnl >= 0 ? '+' : ''}{formatNum(accPnl)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>總匯出金額：</span>
              <span className="font-bold text-sm">{formatNum(accCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>總入帳金額：</span>
              <span className="font-bold text-sm">{formatNum(accInflow)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>投資上限：</span>
              <span className="font-bold text-sm">{accountLimitInput ? `$${formatNum(accountLimitInput)}` : '未設定'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>投資市值：</span>
              <span className="font-bold text-sm">{formatNum(accMarketValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>尚可投資：</span>
              <span className="font-bold text-sm">
                {remainingLimit !== null ? `$${formatNum(remainingLimit)}` : '未設定'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

