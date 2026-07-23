import React from 'react';
import { useStockStore } from '../store/useStockStore';
import { calcTradeDetails, formatNum, formatPct, getPnlColorClass } from '../utils/stockMath';

export const Header: React.FC = () => {
  const {
    accounts,
    currentAccountId,
    setShowAccountModal,
    setShowProfitSummaryModal,
    isLiveSimulating,
    toggleLiveSim,
    isRefreshing,
    refreshPrices,
    isMarketOpen,
    openAddModal,
    holdingsData,
    globalDiscount,
    toggleLiveSimulation,
    canInstallPwa,
    triggerPwaInstall
  } = useStockStore();

  const currentAccount = accounts.find((a) => a.id === currentAccountId) || accounts[0];
  const list = holdingsData[currentAccountId] || [];

  let marketValue = 0;
  let cost = 0;
  let unrealizedPnl = 0;

  list.forEach((item) => {
    const isShort = item.tradeType && item.tradeType.startsWith('空');
    const disc = item.discount !== undefined ? item.discount : globalDiscount;

    const buyFeeObj = calcTradeDetails(item.buyPrice, item.shares, disc, item.minFee || 20, true, item.assetType, item.tradeType, globalDiscount);
    const buyCost = (item.buyPrice * item.shares) + buyFeeObj.fee;

    const sellDetails = calcTradeDetails(item.currentPrice, item.shares, disc, item.minFee || 20, false, item.assetType, item.tradeType, globalDiscount);
    const estProceeds = (item.currentPrice * item.shares) - sellDetails.fee - sellDetails.tax;

    let pnl = estProceeds - buyCost;
    if (isShort) pnl = buyCost - estProceeds;

    cost += buyCost;
    marketValue += item.currentPrice * item.shares;
    unrealizedPnl += pnl;
  });

  const unrealizedPnlPct = cost > 0 ? (unrealizedPnl / cost) * 100 : 0;

  const liveStatusText = !isLiveSimulating
    ? '靜態價'
    : isMarketOpen
    ? '連動中 (盤中)'
    : '連動中 (盤後價)';

  const liveStatusTooltip = !isLiveSimulating
    ? '即時數據連動已關閉'
    : isMarketOpen
    ? '即時連動中：交易時間 09:00~13:30，數據實時連動'
    : '連動中：非交易時間，目前顯示最新盤後真實收盤價';

  return (
    <header className="bg-slate-800 border-b border-slate-700 p-3 sticky top-0 z-30 shadow-md">
      {/* 上方快捷按鈕列 */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
        <div className="flex items-center space-x-3">
          {/* 左上角按鈕：獲利試算 modal 觸發 */}
          <button
            onClick={() => setShowProfitSummaryModal(true)}
            title="獲利試算總覽"
            className="p-1.5 text-amber-400 hover:text-amber-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition relative"
          >
            <i className="fa-solid fa-clipboard-list text-lg"></i>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </button>

          {/* 帳戶切換區 */}
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center space-x-1.5 bg-slate-700/70 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs border border-slate-600 transition"
          >
            <i className="fa-solid fa-wallet text-amber-400"></i>
            <span className="font-bold text-slate-200">{currentAccount.name}</span>
            <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
          </button>
        </div>

        {/* 動態連動與動作按鈕 */}
        <div className="flex items-center space-x-2">
          {canInstallPwa && (
            <button
              onClick={triggerPwaInstall}
              title="安裝本系統至桌面 / 手機主畫面"
              className="text-xs bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold px-2 py-1 rounded-md shadow flex items-center space-x-1"
            >
              <i className="fa-solid fa-download text-[11px]"></i>
              <span>安裝 App</span>
            </button>
          )}
          <button
            onClick={toggleLiveSim}
            title={liveStatusTooltip}
            className={`px-2 py-1 rounded-md text-[11px] border flex items-center space-x-1 transition ${
              isLiveSimulating
                ? isMarketOpen
                  ? 'bg-emerald-900/60 text-emerald-400 border-emerald-600'
                  : 'bg-amber-900/60 text-amber-400 border-amber-600'
                : 'bg-slate-700/60 text-slate-400 border-slate-600'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isLiveSimulating && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    isMarketOpen ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLiveSimulating
                    ? isMarketOpen
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                    : 'bg-slate-500'
                }`}
              ></span>
            </span>
            <span>{liveStatusText}</span>
          </button>

          <button
            onClick={refreshPrices}
            title="手動更新價位"
            className="p-1.5 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            <i className={`fa-solid fa-rotate-right ${isRefreshing ? 'fa-spin' : ''}`}></i>
          </button>

          <button
            onClick={openAddModal}
            className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            <i className="fa-solid fa-circle-plus text-lg"></i>
          </button>
        </div>
      </div>

      {/* 總體庫存卡片數據 SUMMARY */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700">
          <div className="text-[11px] text-slate-400">總市值</div>
          <div className="text-sm font-bold text-slate-100">${formatNum(marketValue)}</div>
        </div>
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700">
          <div className="text-[11px] text-slate-400">總匯出成本</div>
          <div className="text-sm font-bold text-slate-200">${formatNum(cost)}</div>
        </div>
        <div
          className={`bg-slate-900/80 p-2 rounded-lg border border-slate-700 ${
            unrealizedPnl >= 0 ? 'bg-tw-up/20' : 'bg-tw-down/20'
          }`}
        >
          <div className="text-[11px] text-slate-400">未實現損益</div>
          <div className={`text-sm font-bold ${getPnlColorClass(unrealizedPnl)}`}>
            {unrealizedPnl >= 0 ? '+' : ''}
            {formatNum(unrealizedPnl)}
          </div>
          <div className={`text-[10px] ${getPnlColorClass(unrealizedPnl)}`}>
            ({formatPct(unrealizedPnlPct)})
          </div>
        </div>
      </div>
    </header>
  );
};
