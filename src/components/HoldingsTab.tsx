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
  getPriceChangeColorClass,
  getTradeTypeStyle
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
    openEditLotModal,
    lastSplitInfo,
    undoSplitMergedHolding,
    openAddModal,
    openEditModal,
    openSellModal,
    deleteHolding,
    splitMergedHolding,
    togglePinHolding,
    moveHoldingOrder,
    themeMode,
    holdingDisplaySettings,
    openShareModal,
    setShowShareModal,
    setShowTransferModal,
    openTransferHoldingModal,
    accounts
  } = useStockStore();

  const isLight = themeMode === 'light';
  const currentList = holdingsData[currentAccountId] || [];
  const currentAccountName = accounts.find(a => a.id === currentAccountId)?.name || '目前帳戶';

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

  const pinnedItems = filtered.filter(h => h.pinned);
  const unpinnedItems = filtered.filter(h => !h.pinned);

  const sortFn = (a: ComputedHolding, b: ComputedHolding) => {
    if (sortMode === 'pnl') {
      return b.unrealizedPnl - a.unrealizedPnl;
    } else if (sortMode === 'marketValue') {
      return b.marketValue - a.marketValue;
    } else if (sortMode === 'symbol') {
      return a.symbol.localeCompare(b.symbol);
    } else {
      // 'createdAt' (default/custom)
      const timeA = parseInt(a.id.replace(/[^\d]/g, '')) || 0;
      const timeB = parseInt(b.id.replace(/[^\d]/g, '')) || 0;
      return timeB - timeA;
    }
  };

  pinnedItems.sort(sortFn);
  unpinnedItems.sort(sortFn);

  const sortedList = [...pinnedItems, ...unpinnedItems];

  const sortModeLabel = 
    sortMode === 'createdAt' ? '最新加入 (自訂)' :
    sortMode === 'pnl' ? '損益最高' :
    sortMode === 'marketValue' ? '市值最高' : '代號排序';

  return (
    <div className="space-y-3">
      {/* 臨時帳戶橫幅提示 (當現為臨時帳戶時顯示) */}
      {currentAccountId === 'acc-temp' && (
        <div className={`p-3 rounded-xl border flex items-center justify-between shadow ${
          isLight ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-purple-950/40 border-purple-700/60 text-purple-200'
        }`}>
          <div className="flex items-center space-x-2 text-xs">
            <i className="fa-solid fa-clock-rotate-left text-base text-purple-400"></i>
            <div>
              <div className="font-extrabold text-sm">【臨時帳戶】({currentList.length} 筆匯入資料)</div>
              <div className="opacity-80 text-[11px]">來自文字分享匯入，可隨時一鍵轉存至正式帳戶</div>
            </div>
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            disabled={currentList.length === 0}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-white font-extrabold rounded-lg text-xs shadow flex items-center space-x-1"
          >
            <i className="fa-solid fa-right-left"></i>
            <span>一鍵轉存帳戶</span>
          </button>
        </div>
      )}

      {/* 總筆數提示與分享/匯入按鈕 */}
      <div className="flex items-center justify-between text-xs px-1 font-bold">
        <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>
          <i className="fa-solid fa-layer-group text-blue-500 mr-1.5"></i>
          [{currentAccountName}] 筆記 (顯示 {sortedList.length} 筆 / 共 {currentList.length} 筆)
          {pinnedItems.length > 0 && <span className="ml-2 text-amber-500 font-extrabold">📌 {pinnedItems.length} 筆置頂</span>}
        </span>

        {/* 上方右側：分享與匯入快捷按鈕 */}
        <div className="flex space-x-1.5">
          <button
            onClick={() => openShareModal(null)}
            className="px-2 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30 rounded-md text-[11px] font-bold transition flex items-center space-x-1"
            title="分享或匯入文字版庫存"
          >
            <i className="fa-solid fa-share-nodes"></i>
            <span>分享/匯入</span>
          </button>
        </div>
      </div>

      {/* 分類與排序列 */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 rounded-lg border transition ${
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
          className={`text-xs px-2 py-1 rounded flex items-center justify-center space-x-1 transition font-bold ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
          title="切換排序方式 (釘選項目固定維持最頂端)"
        >
          <i className="fa-solid fa-arrow-down-short-wide text-xs"></i>
          <span>{sortModeLabel}</span>
        </button>
      </div>

      {/* 復原拆分橫幅提示 */}
      {lastSplitInfo && (
        <div className={`p-3 rounded-xl border flex items-center justify-between shadow ${
          isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-950/40 border-amber-700/60 text-amber-200'
        }`}>
          <div className="flex items-center space-x-2 text-xs font-bold">
            <i className="fa-solid fa-rotate-left text-amber-500 text-base"></i>
            <div>
              <div className="font-extrabold text-sm">【可復原拆分】({lastSplitInfo.parentHolding.symbol} - {lastSplitInfo.parentHolding.name})</div>
              <div className="opacity-80 text-[11px]">已記錄拆分前之合併狀態，點擊右側按鈕可一鍵將獨立筆記恢復重新合併</div>
            </div>
          </div>
          <button
            onClick={undoSplitMergedHolding}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs shadow flex items-center space-x-1 transition"
          >
            <i className="fa-solid fa-object-group"></i>
            <span>復原拆分</span>
          </button>
        </div>
      )}

      {/* 庫存列表 (網格呈現：手機 1 欄、iPad 2 欄、PC 3 欄) */}
      {sortedList.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border border-dashed transition-colors ${
          isLight ? 'bg-white border-slate-300 text-slate-500' : 'bg-slate-800/50 border-slate-700 text-slate-400'
        }`}>
          <i className="fa-solid fa-briefcase text-4xl mb-3 text-slate-400"></i>
          <p className="font-bold text-base">目前帳戶尚無庫存股票筆記</p>
          <p className="text-xs mt-1 opacity-80">請點擊上方【新增庫存筆記】或在成交試算中轉入</p>
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <i className="fa-solid fa-plus mr-1"></i>
              新增第一筆庫存
            </button>
            <button
              onClick={() => openShareModal(null)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <i className="fa-solid fa-file-import mr-1"></i>
              匯入分享文字
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start">
          {sortedList.map((item) => {
            const tradeStyle = getTradeTypeStyle(item.tradeType);
            const disc = item.discount !== undefined ? item.discount : globalDiscount;
            const breakEven = calcBreakEvenPrice(
              item.buyPrice,
              disc,
              item.minFee || 20,
              item.shares,
              item.assetType,
              item.tradeType,
              globalDiscount,
              item.symbol
            );
            const isLoss = item.unrealizedPnl < 0;
            const ticks = isLoss
              ? calcTicksBetween(item.currentPrice, breakEven, item.assetType, item.symbol)
              : calcTicksBetween(breakEven, item.currentPrice, item.assetType, item.symbol);

            const priceDiff = Math.abs(breakEven - item.currentPrice);
            const diffText = priceDiff > 0 ? ` (+$${priceDiff.toFixed(2)})` : '';

            return (
              <div
                key={item.id}
                className={`rounded-xl p-3 border transition shadow-sm relative overflow-hidden ${tradeStyle.cardBorder} ${
                  item.pinned
                    ? (isLight ? 'bg-amber-50/50 border-amber-400 shadow-md ring-1 ring-amber-300' : 'bg-slate-800 border-amber-500/80 shadow-lg ring-1 ring-amber-500/40')
                    : (isLight ? 'bg-white hover:border-slate-300' : 'bg-slate-800 hover:border-slate-600')
                } ${item.flashClass || ''}`}
              >
                {/* 標題列：代號/名稱、特色交易標籤與未實現損益 */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
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
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-black ${tradeStyle.badgeClass}`}>
                        {tradeStyle.label}
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

                  {/* 釘選按鈕與損益區塊 */}
                  <div className="flex flex-col items-end space-y-1">
                    <button
                      onClick={() => togglePinHolding(item.id)}
                      title={item.pinned ? "取消釘選置頂" : "將此庫存固定置頂於最上方"}
                      className={`text-xs px-2 py-0.5 rounded-md transition font-bold flex items-center space-x-1 border ${
                        item.pinned
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : (isLight ? 'bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-700 border-slate-200' : 'bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-amber-300 border-slate-600')
                      }`}
                    >
                      <i className="fa-solid fa-thumbtack text-[11px]"></i>
                      <span>{item.pinned ? '已置頂' : '釘選'}</span>
                    </button>

                    <div className="text-right pt-1">
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
                </div>

                {/* 檔位位置與保本價提示區塊 */}
                {(holdingDisplaySettings.showTickInfo || holdingDisplaySettings.showBreakEvenPrice) && (
                  <div className={`mt-2 p-1.5 rounded-lg text-xs flex items-center justify-between font-bold border ${
                    isLoss
                      ? (isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-800/50 text-rose-300')
                      : (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300')
                  }`}>
                    {holdingDisplaySettings.showTickInfo ? (
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-extrabold ${
                          isLoss ? 'bg-rose-500 text-white border-rose-600' : 'bg-emerald-500 text-white border-emerald-600'
                        }`}>
                          {isLoss ? '距離賺錢' : '持股位置'}
                        </span>
                        <span className="text-xs">
                          {isLoss
                            ? `距離保本打平還差上漲 ${ticks} 檔${diffText}`
                            : `目前已經賺了 ${ticks} 檔${diffText}`}
                        </span>
                      </div>
                    ) : <div />}
                    {holdingDisplaySettings.showBreakEvenPrice && (
                      <div className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        保本價: <strong className="underline">${breakEven.toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* 預估賣出手續費與證交稅明細 */}
                {holdingDisplaySettings.showFeeTaxDetails && (() => {
                  const sellDetails = calcTradeDetails(item.currentPrice, item.shares, disc, item.minFee || 20, false, item.assetType, item.tradeType, globalDiscount);
                  return (
                    <div className={`mt-1.5 px-2 py-1 rounded text-[11px] flex justify-between font-medium border ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/60 border-slate-700/60 text-slate-400'
                    }`}>
                      <span>預估賣出交易費用：</span>
                      <span>
                        手續費 <strong>${formatNum(sellDetails.fee)}</strong> + 證交稅 <strong>${formatNum(sellDetails.tax)}</strong> = 總費用 <strong>${formatNum(sellDetails.fee + sellDetails.tax)}</strong> 元
                      </span>
                    </div>
                  );
                })()}

                {/* 合併明細（支援長按/點擊修改個別筆記）與拆回按鈕區塊 */}
                {holdingDisplaySettings.showLotDetails && item.lots && item.lots.length > 1 && (
                  <div className={`mt-2 p-2 rounded-lg text-xs border space-y-1.5 ${
                    isLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-900/90 border-blue-500/40 text-blue-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold flex items-center space-x-1">
                        <i className="fa-solid fa-object-group text-blue-400"></i>
                        <span>已加權合併 {item.lots.length} 筆筆記 (均價 ${item.buyPrice})</span>
                      </span>
                      <button
                        onClick={() => splitMergedHolding(item.id)}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[11px] shadow transition"
                        title="將此合併筆記拆回獨立庫存卡片"
                      >
                        <i className="fa-solid fa-code-branch mr-1"></i>
                        拆回獨立筆記
                      </button>
                    </div>
                    <div className="divide-y divide-blue-200/40 text-[11px] pt-1 space-y-1">
                      {item.lots.map((lot, idx) => {
                        const isSell = !!lot.isSellLot;
                        return (
                          <div
                            key={lot.id || idx}
                            onClick={() => openEditLotModal(item.id, lot)}
                            title={`點擊或長按修改此筆${isSell ? '賣出' : '買進'}紀錄`}
                            className={`pt-1 flex justify-between items-center rounded px-1.5 cursor-pointer transition group ${
                              isSell
                                ? (isLight ? 'bg-rose-100/70 hover:bg-rose-200/80 text-rose-950 font-bold' : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 font-bold')
                                : (isLight ? 'hover:bg-blue-200/40 text-slate-800' : 'hover:bg-slate-800/80 text-slate-200')
                            }`}
                          >
                            <span>
                              第 {idx + 1} 筆 ({lot.date}) :{' '}
                              <strong className={isSell ? 'text-rose-600 dark:text-rose-400 font-black' : ''}>
                                ${isSell ? (lot.sellPrice || lot.buyPrice) : lot.buyPrice}
                              </strong>
                              {isSell && <span className="text-[10px] ml-1 text-rose-500 font-bold">(賣價)</span>}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <span>
                                {isSell ? '賣出: ' : '買進: '}
                                <strong className={isSell ? 'text-rose-600 dark:text-rose-400 font-black' : ''}>
                                  {formatNum(lot.shares)}股
                                </strong>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditLotModal(item.id, lot);
                                }}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition ${
                                  isSell
                                    ? 'text-rose-500 hover:text-rose-400 bg-rose-500/10 border-rose-500/30'
                                    : 'text-amber-500 hover:text-amber-400 bg-amber-500/10 border-amber-500/30'
                                }`}
                                title="長按或點擊修改"
                              >
                                <i className="fa-solid fa-pen-to-square mr-0.5"></i>
                                修改
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 📜 交易與變更歷史履歷區塊 (何時賣出/買進/還原/價格) */}
                {item.activityLogs && item.activityLogs.length > 0 && (
                  <div className={`mt-2 p-2 rounded-lg text-xs border space-y-1 ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-700 text-slate-300'
                  }`}>
                    <div className="font-bold flex items-center justify-between text-[11px] text-amber-500 border-b pb-1 border-slate-300/30 dark:border-slate-700/60">
                      <span className="flex items-center space-x-1">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        <span>交易與變更履歷 ({item.activityLogs.length} 筆)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">記錄賣出均價、還原與合併歷史</span>
                    </div>
                    <div className="divide-y divide-slate-300/30 dark:divide-slate-700/50 text-[10px] max-h-32 overflow-y-auto pr-0.5">
                      {item.activityLogs.map((log) => (
                        <div key={log.id} className="py-1 flex justify-between items-center">
                          <span className="font-medium">{log.note || log.action}</span>
                          <span className="text-slate-400 font-bold ml-2 shrink-0">{log.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ETF 專屬當下折溢價提示區塊 */}
                {holdingDisplaySettings.showEtfDiscount && (() => {
                  const isEtf = item.assetType === 'ETF' || item.symbol.startsWith('00') || item.nav !== undefined;
                  if (!isEtf) return null;

                  const activeNav = item.nav && item.nav > 0 ? item.nav : item.currentPrice;
                  const pd = calcEtfPremiumDiscount(item.currentPrice, activeNav, item.shares);
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
                        <span className="text-[10px] font-bold px-1 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-300">
                          🟢 即時估算
                        </span>
                        <span className={`text-[10px] font-bold px-1 py-0.5 rounded border ${
                          isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900/60 border-slate-700 text-slate-200'
                        }`}>
                          ETF 折溢價
                        </span>
                        <span>
                          市價 ${item.currentPrice.toFixed(2)} (淨值 ${activeNav.toFixed(2)}) ➔{' '}
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

                {/* 快捷操作鈕與順序微調按鈕 */}
                <div className={`flex justify-between items-center mt-2 pt-2 border-t text-xs ${
                  isLight ? 'border-slate-200' : 'border-slate-700/40'
                }`}>
                  {/* 自訂順序調整鈕 */}
                  {sortMode === 'createdAt' ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => moveHoldingOrder(item.id, 'up')}
                        title="往上移動順序"
                        className={`px-2 py-1 text-xs rounded font-bold transition flex items-center space-x-1 ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                      >
                        <i className="fa-solid fa-arrow-up text-[10px]"></i>
                        <span>上移</span>
                      </button>
                      <button
                        onClick={() => moveHoldingOrder(item.id, 'down')}
                        title="往下移動順序"
                        className={`px-2 py-1 text-xs rounded font-bold transition flex items-center space-x-1 ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                      >
                        <i className="fa-solid fa-arrow-down text-[10px]"></i>
                        <span>下移</span>
                      </button>
                    </div>
                  ) : <div />}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openTransferHoldingModal(item)}
                      title="轉移此筆個股/ETF至其他帳戶"
                      className={`px-2 py-1 rounded transition flex items-center space-x-1 ${
                        isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-700 hover:bg-slate-600 text-blue-300'
                      }`}
                    >
                      <i className="fa-solid fa-right-left text-xs"></i>
                      <span className="text-[11px] font-bold">轉移</span>
                    </button>
                    <button
                      onClick={() => openShareModal(item)}
                      title="分享此筆個股文字"
                      className={`px-2 py-1 rounded transition ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 text-amber-700' : 'bg-slate-700 hover:bg-slate-600 text-amber-400'
                      }`}
                    >
                      <i className="fa-solid fa-share-nodes"></i>
                    </button>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
