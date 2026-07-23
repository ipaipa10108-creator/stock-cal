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
    deleteHolding
  } = useStockStore();

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
      <div className="flex items-center justify-between bg-slate-800 p-1.5 rounded-lg border border-slate-700">
        <div className="flex space-x-1">
          {['現股交易', '當沖交易', '信用交易'].map((type) => (
            <button
              key={type}
              onClick={() => setHoldingTradeTypeFilter(type)}
              className={`px-3 py-1 rounded-md text-xs transition ${
                holdingTradeTypeFilter === type
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* 排序按鈕 */}
        <button
          onClick={toggleSort}
          className="text-xs text-slate-300 hover:text-white px-2 py-1 bg-slate-700 rounded flex items-center space-x-1"
        >
          <i className="fa-solid fa-arrow-down-short-wide text-xs"></i>
          <span>{sortModeLabel}</span>
        </button>
      </div>

      {/* 庫存列表 */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 space-y-3">
          <i className="fa-solid fa-folder-open text-4xl text-slate-600"></i>
          <p className="text-sm">目前此分類下無庫存股票</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg shadow transition"
          >
            + 新增第一筆庫存
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-800 rounded-xl p-3 border border-slate-700/80 hover:border-slate-600 transition shadow-sm relative overflow-hidden ${
                item.flashClass || ''
              }`}
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
                      className="text-base font-bold text-white hover:text-amber-300 hover:underline transition flex items-center space-x-1 group"
                    >
                      <span>{item.symbol} - {item.name}</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs text-amber-400 opacity-70 group-hover:opacity-100"></i>
                    </a>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-amber-300 border border-slate-600">
                      {item.tradeType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                    <span>買進 : <strong className="text-slate-200">${item.buyPrice}</strong></span>
                    <span>股數 : <strong className="text-slate-200">{formatNum(item.shares)}</strong></span>
                  </div>
                  <div className="text-xs text-slate-400">
                    現價 : <strong className={getPriceChangeColorClass(item.currentPrice, item.buyPrice)}>${item.currentPrice.toFixed(2)}</strong>
                  </div>
                </div>

                {/* 損益與報酬率 */}
                <div className="text-right">
                  <div className="text-xs text-slate-400">未實現損益 :</div>
                  <div className={`text-base font-bold ${getPnlColorClass(item.unrealizedPnl)}`}>
                    {item.unrealizedPnl >= 0 ? '+' : ''}{formatNum(item.unrealizedPnl)}
                  </div>
                  <div className={`text-xs font-semibold ${getPnlColorClass(item.unrealizedPnl)}`}>
                    {formatPct(item.unrealizedPnlPct)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{item.date}</div>
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
                        ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                        : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold px-1 rounded bg-slate-900/60 border border-slate-700">
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
              <div className="flex justify-end space-x-2 mt-2 pt-2 border-t border-slate-700/40 text-xs">
                <button
                  onClick={() => openSellModal(item)}
                  className="px-2.5 py-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded flex items-center space-x-1"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span>平倉/賣出</span>
                </button>
                <button
                  onClick={() => openEditModal(item)}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  onClick={() => deleteHolding(item.id)}
                  className="px-2 py-1 bg-slate-700 hover:bg-rose-900/50 text-rose-400 rounded"
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
