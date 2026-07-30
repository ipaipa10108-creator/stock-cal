import React from 'react';
import { useStockStore } from '../store/useStockStore';
import { calcTradeDetails, formatNum, formatPct, getPnlColorClass } from '../utils/stockMath';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
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
    canInstallPwa,
    triggerPwaInstall,
    themeMode,
    toggleThemeMode,
    apiProvider
  } = useStockStore();

  const providerLabelMap: Record<string, string> = {
    yahoo: 'Yahoo即時',
    twse_mis: 'MIS即時',
    twse_openapi: 'OpenAPI',
    auto: '智選即時'
  };

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
    ? `連動 (${providerLabelMap[apiProvider] || '即時'})`
    : `連動 (${providerLabelMap[apiProvider] || '即時'})`;

  const liveStatusTooltip = !isLiveSimulating
    ? '即時數據連動已關閉'
    : `即時連動中 (目前數據源：${providerLabelMap[apiProvider] || '即時'})`;

  const isLight = themeMode === 'light';

  return (
    <header className={`p-3 md:p-4 sticky top-0 z-30 shadow-md border-b transition-colors ${
      isLight ? 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-900' : 'bg-slate-800/95 backdrop-blur-md border-slate-700 text-slate-100'
    }`}>
      {/* 上方快捷按鈕列 & Desktop 導覽列 */}
      <div className={`flex items-center justify-between pb-2 mb-2 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-700/60'
      }`}>
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* 系統標題 (僅在桌機大螢幕顯示) */}
          <div className="hidden lg:flex items-center space-x-2 mr-2">
            <i className="fa-solid fa-chart-line text-amber-500 text-xl"></i>
            <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent">
              台股算盤庫存管理
            </span>
          </div>

          {/* 左上角按鈕：獲利試算 modal 觸發 */}
          <button
            onClick={() => setShowProfitSummaryModal(true)}
            title="獲利試算總覽"
            className={`p-1.5 md:px-3 md:py-1.5 rounded-lg transition relative flex items-center space-x-1.5 text-xs font-bold ${
              isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : 'bg-slate-700 hover:bg-slate-600 text-amber-400'
            }`}
          >
            <i className="fa-solid fa-clipboard-list text-base md:text-lg"></i>
            <span className="hidden md:inline">總獲利分析</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </button>

          {/* 帳戶切換區 */}
          <button
            onClick={() => setShowAccountModal(true)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 md:py-1.5 rounded-lg text-xs md:text-sm border transition font-bold ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-700/70 hover:bg-slate-700 border-slate-600 text-slate-100'
            }`}
          >
            <i className="fa-solid fa-wallet text-amber-500"></i>
            <span>{currentAccount.name}</span>
            <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
          </button>

          {/* PC 桌機與 iPad 專屬頁籤導覽 (sm: 640px+ 螢幕顯示) */}
          <nav className="hidden sm:flex items-center space-x-1 border-l pl-3 border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('holdings')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'holdings'
                  ? 'bg-amber-500 text-white shadow'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-box-archive"></i>
              <span>庫存看板</span>
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-amber-500 text-white shadow'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-calculator"></i>
              <span>成交試算</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-white shadow'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>歷史紀錄</span>
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'market'
                  ? 'bg-amber-500 text-white shadow'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-globe"></i>
              <span>指數行情</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'guide'
                  ? 'bg-amber-500 text-white shadow'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-graduation-cap"></i>
              <span>新手教學</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-white shadow'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-sliders"></i>
              <span>系統設定</span>
            </button>
          </nav>
        </div>

        {/* 動態連動與動作按鈕 */}
        <div className="flex items-center space-x-1.5 md:space-x-2">
          {/* 日/夜模式切換鈕 */}
          <button
            onClick={toggleThemeMode}
            title={isLight ? '切換至夜間模式' : '切換至日間模式'}
            className={`p-1.5 md:px-2.5 md:py-1.5 rounded-lg transition text-xs font-semibold flex items-center space-x-1 ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-amber-600'
                : 'bg-slate-700 hover:bg-slate-600 text-sky-300'
            }`}
          >
            <i className={`fa-solid ${isLight ? 'fa-sun' : 'fa-moon'} text-base`}></i>
          </button>

          {canInstallPwa && (
            <button
              onClick={triggerPwaInstall}
              title="安裝本系統至桌面 / 手機主畫面"
              className="text-xs bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-md shadow flex items-center space-x-1"
            >
              <i className="fa-solid fa-download text-[11px]"></i>
              <span>安裝 App</span>
            </button>
          )}

          <button
            onClick={toggleLiveSim}
            title={liveStatusTooltip}
            className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[11px] md:text-xs border flex items-center space-x-1 font-semibold transition ${
              isLiveSimulating
                ? isMarketOpen
                  ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-900/60 text-emerald-300 border-emerald-600'
                  : isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-900/60 text-amber-300 border-amber-600'
                : isLight ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-slate-700/60 text-slate-400 border-slate-600'
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
                    : 'bg-slate-400'
                }`}
              ></span>
            </span>
            <span>{liveStatusText}</span>
          </button>

          <button
            onClick={() => refreshPrices(true)}
            title="手動更新價位 (觸發盤中/最新連動價)"
            className={`p-1.5 md:px-2.5 md:py-1.5 rounded-lg transition text-xs font-semibold ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            <i className={`fa-solid fa-rotate-right ${isRefreshing ? 'fa-spin text-blue-400' : ''}`}></i>
          </button>

          <button
            onClick={openAddModal}
            className={`px-2.5 py-1.5 rounded-lg transition text-xs font-bold flex items-center space-x-1.5 shadow ${
              isLight ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title="新增庫存股票"
          >
            <i className="fa-solid fa-circle-plus text-base"></i>
            <span className="hidden sm:inline">新增庫存</span>
          </button>
        </div>
      </div>

      {/* 總體庫存卡片數據 SUMMARY Dashboard (手機 3 欄 / 平板與桌機 5 欄) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3 text-center">
        <div className={`p-2 md:p-3 rounded-lg border transition ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-700'
        }`}>
          <div className={`text-[11px] md:text-xs ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>總市值</div>
          <div className={`text-sm md:text-base font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>${formatNum(marketValue)}</div>
        </div>
        <div className={`p-2 md:p-3 rounded-lg border transition ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-700'
        }`}>
          <div className={`text-[11px] md:text-xs ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>總匯出成本</div>
          <div className={`text-sm md:text-base font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>${formatNum(cost)}</div>
        </div>
        <div
          className={`p-2 md:p-3 rounded-lg border transition ${
            unrealizedPnl >= 0 ? (isLight ? 'bg-rose-50 border-rose-200' : 'bg-tw-up/20 border-slate-700') : (isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-tw-down/20 border-slate-700')
          }`}
        >
          <div className={`text-[11px] md:text-xs ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>未實現損益</div>
          <div className={`text-sm md:text-base font-extrabold ${getPnlColorClass(unrealizedPnl)}`}>
            {unrealizedPnl >= 0 ? '+' : ''}
            {formatNum(unrealizedPnl)}
          </div>
          <div className={`text-[10px] md:text-xs font-bold ${getPnlColorClass(unrealizedPnl)}`}>
            ({formatPct(unrealizedPnlPct)})
          </div>
        </div>

        {/* 擴充卡片 (平板 sm 及桌機顯示) */}
        <div className={`hidden sm:block p-2 md:p-3 rounded-lg border transition ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-700'
        }`}>
          <div className={`text-[11px] md:text-xs ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>庫存檔數</div>
          <div className={`text-sm md:text-base font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{list.length} 檔股票</div>
          <div className="text-[10px] text-slate-400 font-semibold">當前帳戶數量</div>
        </div>
        <div className={`hidden sm:block p-2 md:p-3 rounded-lg border transition ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-700'
        }`}>
          <div className={`text-[11px] md:text-xs ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>目前管理帳戶</div>
          <div className={`text-sm md:text-base font-bold text-amber-500 truncate`}>{currentAccount.name}</div>
          <div className="text-[10px] text-slate-400 font-semibold">折讓 {globalDiscount * 10} 折</div>
        </div>
      </div>
    </header>
  );
};

