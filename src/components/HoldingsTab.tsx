import React from 'react';
import { useStockStore } from '../store/useStockStore';
import {
  calcTradeDetails,
  calcBreakEvenPrice,
  calcTicksBetween,
  calcEtfPremiumDiscount,
  formatNum,
  formatPct,
  getPnlColorClass,
  getPriceChangeColorClass
} from '../utils/stockMath';
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
    splitMergedHolding,
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
      {/* 總筆數提示與分類篩選 */}
      <div className="flex items-center justify-between text-xs px-1 font-bold">
        <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>
          <i className="fa-solid fa-layer-group text-blue-500 mr-1.5"></i>
          庫存筆記 (顯示 {filtered.length} 筆 / 共 {currentList.length} 筆資料)
        </span>
      </div>

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
          {filtered.map((item) => {
            const disc = item.discount !== undefined ? item.discount : globalDiscount;
            const breakEven = calcBreakEvenPrice(
              item.buyPrice,
              disc,
              item.minFee || 20,
              item.shares,
              item.assetType,
              item.tradeType,
              globalDiscount
            );
            const isLoss = item.unrealizedPnl < 0;
            const ticks = isLoss
              ? calcTicksBetween(item.currentPrice, breakEven)
              : calcTicksBetween(breakEven, item.currentPrice);

            return (
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

                {/* 檔位位置提示區塊 */}
                <div className={`mt-2 p-1.5 rounded-lg text-xs flex items-center justify-between font-bold border ${
                  isLoss
                    ? (isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-800/50 text-rose-300')
                    : (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300')
                }`}>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-extrabold ${
                      isLoss ? 'bg-rose-500 text-white border-rose-600' : 'bg-emerald-500 text-white border-emerald-600'
                    }`}>
                      {isLoss ? '距離賺錢' : '持股位置'}
                    </span>
                    <span className="text-xs">
                      {isLoss
                        ? `距離保本打平還差上漲 ${ticks} 檔`
                        : `目前已經賺了 ${ticks} 檔`}
                    </span>
                  </div>
                  <div className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    保本價: <strong className="underline">${breakEven.toFixed(2)}</strong>
                  </div>
                </div>

                {/* 合併明細與拆回按鈕區塊 */}
                {item.lots && item.lots.length > 1 && (
                  <div className={`mt-2 p-2 rounded-lg text-xs border space-y-1.5 ${
                    isLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-900/90 border-blue-500/40 text-blue-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold flex items-center space-x-1">
                        <i className="fa-solid fa-object-group text-blue-400"></i>
                        <span>已加權合併 {item.lots.length} 筆筆記 (平均成本 ${item.buyPrice})</span>
                      </span>
                      <button
                        onClick={() => splitMergedHolding(item.id)}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[11px] shadow transition"
                      >
                        <i className="fa-solid fa-code-branch mr-1"></i>
                        拆回獨立筆記
                      </button>
                    </div>
                    <div className="divide-y divide-blue-200/40 text-[11px] pt-1">
                      {item.lots.map((lot, idx) => (
                        <div key={lot.id || idx} className="py-1 flex justify-between">
                          <span>第 {idx + 1} 筆 購買日期: <strong>{lot.date}</strong></span>
                          <span>買價: <strong>${lot.buyPrice}</strong> | 股數: <strong>{formatNum(lot.shares)}股</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ETF 專屬當下折溢價提示區塊 */}
                {(() => {
                  const isEtf = item.assetType === 'ETF' || item.symbol.startsWith('00') || item.nav !== undefined;
                  if (!isEtf) return null;

                  const pd = calcEtfPremiumDiscount(item.currentPrice, item.nav, item.shares);
                  if (!pd) {
                    return (
                      <div className={`mt-2 p-1.5 rounded-lg text-xs border flex items-center justify-between ${
                        isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-900 border-amber-500/40 text-amber-300'
                      }`}>
                        <div className="flex items-center space-x-1.5">
                          <i className="fa-solid fa-chart-pie text-amber-500"></i>
                          <span className="font-semibold text-[11px]">ETF 折溢價：尚未輸入估算淨值 (NAV)</span>
                        </div>
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-[10px] px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded shadow-sm"
                        >
                          填寫淨值
                        </button>
                      </div>
                    );
                  }

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
                          isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900/60 border-slate-700 text-slate-200'
                        }`}>
                          ETF 折溢價
                        </span>
                        <span>
                          當前市價 ${item.currentPrice.toFixed(2)} (淨值 ${item.nav?.toFixed(2)}) ➔{' '}
                          <strong>{pd.isPremium ? '溢價' : '折價'} ${Math.abs(pd.diffPerShare).toFixed(2)}</strong> (
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
            );
          })}
        </div>
      )}
    </div>
  );
};
