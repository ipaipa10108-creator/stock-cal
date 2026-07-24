import React from 'react';
import { useStockStore } from '../store/useStockStore';
import { calcTradeDetails, calcEtfPremiumDiscount, formatNum, formatPct, getPnlColorClass, getPriceChangeColorClass } from '../utils/stockMath';
import { ComputedHolding } from '../types/stock';

export const HoldingsTab: React.FC = () => {
  const {
    holdingTradeTypeFilter,
    setHoldingTradeTypeFilter,
    sortMode,
    toggleSort,
    holdingsData,
    currentAccountId,
    globalDiscount,
    openAddModal,
    openEditModal,
    openSellModal,
    deleteHolding,
    themeMode
  } = useStockStore();

  const isLight = themeMode === 'light';
  const currentList = holdingsData[currentAccountId] || [];

  const computedHoldings: ComputedHolding[] = currentList.map((item) => {
    const isShort = item.tradeType && item.tradeType.startsWith('空');
    const disc = item.discount !== undefined ? item.discount : globalDiscount;

    const buyFeeObj = calcTradeDetails(item.buyPrice, item.shares, disc, item.minFee || 20, true, item.assetType, item.tradeType, globalDiscount);
    const buyCost = (item.buyPrice * item.shares) + buyFeeObj.fee;

    const sellDetails = calcTradeDetails(item.currentPrice, item.shares, disc, item.minFee || 20, false, item.assetType, item.tradeType, globalDiscount);
    const estProceeds = (item.currentPrice * item.shares) - sellDetails.fee - sellDetails.tax;

    let unrealizedPnl = estProceeds - buyCost;
    if (isShort) unrealizedPnl = buyCost - estProceeds;

    const unrealizedPnlPct = buyCost > 0 ? (unrealizedPnl / buyCost) * 100 : 0;
    const marketValue = item.currentPrice * item.shares;

    return {
      ...item,
      buyCost,
      estProceeds,
      marketValue,
      unrealizedPnl,
      unrealizedPnlPct
    };
  });

  const filtered = computedHoldings.filter((h) => {
    if (holdingTradeTypeFilter === '現股交易') {
      return !h.tradeType || h.tradeType.includes('現股交易');
    } else if (holdingTradeTypeFilter === '當沖交易') {
      return h.tradeType && h.tradeType.includes('當沖');
    } else if (holdingTradeTypeFilter === '信用交易') {
      return h.tradeType && (h.tradeType.includes('資') || h.tradeType.includes('券'));
    }
    return true;
  });

  if (sortMode === 'pnl') {
    filtered.sort((a, b) => a.unrealizedPnl - b.unrealizedPnl);
  } else if (sortMode === 'marketValue') {
    filtered.sort((a, b) => b.marketValue - a.marketValue);
  } else {
    filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  const sortModeLabel = sortMode === 'pnl' ? '損益排序' : sortMode === 'marketValue' ? '市值排序' : '代號排序';

  return (
    <div className="space-y-3">
      {/* 分類與排序列 */}
      <div className={`flex items-center justify-between p-1.5 rounded-lg border transition ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex space-x-1">
          {['現股交易', '當沖交易', '信用交易'].map((type) => (
            <button
              key={type}
              onClick={() => setHoldingTradeTypeFilter(type)}
              className={`px-3 py-1 rounded-md text-xs transition ${
                holdingTradeTypeFilter === type
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white')
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* 排序按鈕 */}
        <button
          onClick={toggleSort}
          className={`text-xs px-2 py-1 rounded flex items-center space-x-1 transition ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
        >
          <i className="fa-solid fa-arrow-down-short-wide text-xs"></i>
          <span>{sortModeLabel}</span>
        </button>
      </div>

      {/* 庫存列表 */}
      {filtered.length === 0 ? (
        <div className={`text-center py-12 space-y-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <i className="fa-solid fa-folder-open text-4xl text-slate-400"></i>
          <p className="text-sm font-semibold">目前此分類下無庫存股票</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition"
          >
            + 新增第一筆庫存
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl p-3 border transition shadow-sm relative overflow-hidden ${
                isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-800 border-slate-700/80 hover:border-slate-600'
              } ${item.flashClass || ''}`}
            >
              {/* 標題列：代號/名稱與未實現損益 */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://tw.stock.yahoo.com/quote/${item.symbol.toUpperCase()}.TW`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="點擊開啟 Yahoo 股市即時行情與 K 線圖"
                      className={`text-base font-extrabold hover:underline transition flex items-center space-x-1 group ${
                        isLight ? 'text-slate-900 hover:text-amber-600' : 'text-white hover:text-amber-300'
                      }`}
                    >
                      <span>{item.symbol} - {item.name}</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs text-amber-500 opacity-80 group-hover:opacity-100"></i>
                    </a>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                      isLight ? 'bg-slate-100 text-amber-700 border-amber-300' : 'bg-slate-700 text-amber-300 border-slate-600'
                    }`}>
                      {item.tradeType}
                    </span>
                  </div>
                  <div className={`text-xs mt-1 flex items-center space-x-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    <span>買進 : <strong className={isLight ? 'text-slate-900 font-bold' : 'text-slate-100 font-bold'}>${item.buyPrice}</strong></span>
                    <span>股數 : <strong className={isLight ? 'text-slate-900 font-bold' : 'text-slate-100 font-bold'}>{formatNum(item.shares)}</strong></span>
                  </div>
                  <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    現價 : <strong className={`font-extrabold ${getPriceChangeColorClass(item.currentPrice, item.buyPrice)}`}>${item.currentPrice.toFixed(2)}</strong>
                  </div>
                </div>

                {/* 損益與報酬率 */}
                <div className="text-right">
                  <div className={`text-xs ${isLight ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>未實現損益 :</div>
                  <div className={`text-base font-black ${getPnlColorClass(item.unrealizedPnl)}`}>
                    {item.unrealizedPnl >= 0 ? '+' : ''}{formatNum(item.unrealizedPnl)}
                  </div>
                  <div className={`text-xs font-bold ${getPnlColorClass(item.unrealizedPnl)}`}>
                    {formatPct(item.unrealizedPnlPct)}
                  </div>
                  <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-400 font-medium' : 'text-slate-400'}`}>{item.date}</div>
                </div>
              </div>

              {/* ETF 專屬折溢價提示區塊 */}
              {(() => {
                const pd = calcEtfPremiumDiscount(item.currentPrice, item.nav, item.shares);
                if (!pd) return null;
                return (
                  <div
                    className={`mt-2 p-1.5 rounded-lg text-xs border flex items-center justify-between ${
                      pd.isPremium
                        ? (isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/30 border-rose-800/40 text-rose-300')
                        : (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300')
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold px-1 rounded border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900/60 border-slate-700'
                      }`}>
                        ETF 折溢價
                      </span>
                      <span>
                        {pd.isPremium ? '溢價' : '折價'}: <strong>${Math.abs(pd.diffPerShare).toFixed(2)}</strong> (
                        {pd.isPremium ? '+' : ''}{pd.diffPct.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="font-bold underline text-[11px]">
                      相當於 {pd.isPremium ? '多付' : '省下'} ${formatNum(Math.abs(pd.totalDiffAmount))} 元
                    </div>
                  </div>
                );
              })()}

              {/* 快捷操作鈕 */}
              <div className={`flex justify-end space-x-2 mt-2 pt-2 border-t text-xs ${
                isLight ? 'border-slate-200' : 'border-slate-700/40'
              }`}>
                <button
                  onClick={() => openSellModal(item)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded flex items-center space-x-1 shadow-sm transition"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span>平倉/賣出</span>
                </button>
                <button
                  onClick={() => openEditModal(item)}
                  className={`px-2 py-1 rounded transition ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  onClick={() => deleteHolding(item.id)}
                  className={`px-2 py-1 rounded transition ${
                    isLight ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' : 'bg-slate-700 hover:bg-rose-900/50 text-rose-400'
                  }`}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

